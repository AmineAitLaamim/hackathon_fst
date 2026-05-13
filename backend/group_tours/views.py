from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from group_tours.models import (
    GroupStopCheckIn,
    GroupStopComment,
    GroupTourActivity,
    GroupTourMember,
    GroupTourSession,
)
from group_tours.serializers import (
    GroupActivitySerializer,
    GroupCommentCreateSerializer,
    GroupCommentSerializer,
    GroupInviteSerializer,
    GroupSessionSerializer,
    GroupTourCreateSerializer,
)
from tours.models import Tour

User = get_user_model()


def add_activity(session, user, type_, message="", stop_id="", payload=None):
    activity = GroupTourActivity.objects.create(
        session=session,
        user=user,
        type=type_,
        message=message,
        stop_id=stop_id,
        payload=payload or {},
    )
    session.last_activity_at = activity.created_at
    session.save(update_fields=["last_activity_at"])
    return activity


class GroupTourViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _visible_sessions(self, user):
        return GroupTourSession.objects.filter(
            Q(host=user) | Q(members__user=user)
        ).distinct().select_related("tour", "tour__owner", "tour__share", "host").prefetch_related(
            "members",
            "members__user",
        )

    def _session(self, pk, user):
        return get_object_or_404(self._visible_sessions(user), pk=pk)

    def _joined_or_host(self, session, user):
        return session.host_id == user.id or GroupTourMember.objects.filter(
            session=session,
            user=user,
            status=GroupTourMember.Status.JOINED,
        ).exists()

    def list(self, request):
        return Response(GroupSessionSerializer(self._visible_sessions(request.user), many=True).data)

    def create(self, request):
        serializer = GroupTourCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        tour = Tour.objects.get(pk=serializer.validated_data["tour_id"])
        session = GroupTourSession.objects.create(tour=tour, host=request.user)
        GroupTourMember.objects.create(
            session=session,
            user=request.user,
            status=GroupTourMember.Status.JOINED,
            joined_at=timezone.now(),
        )
        add_activity(session, request.user, "session_created", "Group tour session created.")
        return Response(GroupSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        return Response(GroupSessionSerializer(self._session(pk, request.user)).data)

    def destroy(self, request, pk=None):
        session = get_object_or_404(GroupTourSession, pk=pk, host=request.user)
        session.status = GroupTourSession.Status.ENDED
        session.save(update_fields=["status"])
        add_activity(session, request.user, "session_ended", "Group tour session ended.")
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="invite")
    def invite(self, request, pk=None):
        session = get_object_or_404(GroupTourSession, pk=pk, host=request.user)
        serializer = GroupInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        users = User.objects.filter(id__in=serializer.validated_data["friend_ids"]).exclude(id=request.user.id)
        members = []
        for user in users:
            member, _ = GroupTourMember.objects.update_or_create(
                session=session,
                user=user,
                defaults={"status": GroupTourMember.Status.INVITED, "invited_by": request.user},
            )
            members.append(member)
        add_activity(session, request.user, "members_invited", "Members invited to group tour.")
        return Response(GroupSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="join")
    def join(self, request, pk=None):
        session = self._session(pk, request.user)
        member = get_object_or_404(GroupTourMember, session=session, user=request.user)
        member.status = GroupTourMember.Status.JOINED
        member.joined_at = timezone.now()
        member.save(update_fields=["status", "joined_at"])
        add_activity(session, request.user, "member_joined", "Member joined the session.")
        return Response(GroupSessionSerializer(session).data)

    @action(detail=True, methods=["post"], url_path="leave")
    def leave(self, request, pk=None):
        session = self._session(pk, request.user)
        if session.host_id == request.user.id:
            return Response({"detail": "Host must disband the session instead."}, status=400)
        member = get_object_or_404(GroupTourMember, session=session, user=request.user)
        member.status = GroupTourMember.Status.LEFT
        member.save(update_fields=["status"])
        add_activity(session, request.user, "member_left", "Member left the session.")
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path=r"stops/(?P<stop_id>[^/.]+)/checkin")
    def checkin(self, request, pk=None, stop_id=None):
        session = self._session(pk, request.user)
        if not self._joined_or_host(session, request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        GroupStopCheckIn.objects.get_or_create(session=session, user=request.user, stop_id=stop_id)
        activity = add_activity(session, request.user, "stop_checkin", "Checked in at stop.", stop_id=stop_id)
        return Response(GroupActivitySerializer(activity).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path=r"stops/(?P<stop_id>[^/.]+)/comments")
    def comments(self, request, pk=None, stop_id=None):
        session = self._session(pk, request.user)
        if not self._joined_or_host(session, request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = GroupCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = GroupStopComment.objects.create(
            session=session,
            user=request.user,
            stop_id=stop_id,
            comment=serializer.validated_data["comment"],
        )
        add_activity(session, request.user, "stop_comment", serializer.validated_data["comment"], stop_id=stop_id)
        return Response(GroupCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"stops/(?P<stop_id>[^/.]+)/comments/(?P<comment_id>[^/.]+)")
    def delete_comment(self, request, pk=None, stop_id=None, comment_id=None):
        session = self._session(pk, request.user)
        comment = get_object_or_404(GroupStopComment, pk=comment_id, session=session, stop_id=stop_id, user=request.user)
        comment.delete()
        add_activity(session, request.user, "comment_deleted", "Comment deleted.", stop_id=stop_id)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], url_path="activity")
    def activity(self, request, pk=None):
        session = self._session(pk, request.user)
        activities = session.activities.select_related("user")[:50]
        return Response(
            {
                "last_activity_at": session.last_activity_at,
                "results": GroupActivitySerializer(activities, many=True).data,
            }
        )
