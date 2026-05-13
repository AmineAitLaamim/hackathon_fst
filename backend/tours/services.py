from tours.models import Tour


def build_generated_stops(*, themes, duration, budget, notes, interests, health_conditions):
    combined_themes = list(dict.fromkeys([*themes, *interests])) or ["culture", "food"]
    health_note = (
        f"Adapted for: {', '.join(health_conditions)}"
        if health_conditions
        else "Standard accessibility assumptions."
    )
    stops = []
    for index, theme in enumerate(combined_themes[: max(duration, 3)], start=1):
        stops.append(
            {
                "order": index,
                "name": f"Marrakech {theme.title()} Stop {index}",
                "category": theme,
                "schedule": f"Day {min(index, duration)} - {9 + index}:00",
                "walking_distance_minutes": 10 + index * 5,
                "notes": notes or f"Curated for a {budget} budget traveler.",
                "accessibility": health_note,
            }
        )
    return stops


def build_generated_tour(*, user, payload):
    stops = build_generated_stops(
        themes=payload["themes"],
        duration=payload["duration"],
        budget=payload["budget"],
        notes=payload.get("notes", ""),
        interests=user.interests,
        health_conditions=user.health_conditions,
    )
    return Tour.objects.create(
        owner=user,
        title=f"{user.full_name.split()[0]}'s Marrakech Tour",
        description="AI-generated Marrakech itinerary draft.",
        duration=payload["duration"],
        budget=payload["budget"],
        themes=payload["themes"],
        notes=payload.get("notes", ""),
        status=Tour.Status.DRAFT,
        stops=stops,
    )
