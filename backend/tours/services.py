import json

from anthropic import Anthropic
from django.conf import settings

from tours.models import Tour


def build_generated_stops(*, themes, duration, budget, notes, interests, health_conditions):
    combined_themes = list(dict.fromkeys([*themes, *interests])) or ["culture", "food"]
    accessibility_note = (
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
                "schedule": f"Day {min(index, duration)} - {8 + index}:00",
                "walking_distance_minutes": 10 + index * 5,
                "notes": notes or f"Curated for a {budget} budget traveler.",
                "accessibility": accessibility_note,
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
    if settings.ANTHROPIC_API_KEY:
        stops = build_claude_generated_stops(user=user, payload=payload, fallback_stops=stops)

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


def build_claude_generated_stops(*, user, payload, fallback_stops):
    client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    prompt = (
        "Generate a Marrakech tour as JSON only.\n"
        "Return an array of stops. Each stop must include "
        "order, name, category, schedule, walking_distance_minutes, notes, accessibility.\n"
        f"User: {user.full_name}\n"
        f"Interests: {user.interests}\n"
        f"Health conditions: {user.health_conditions}\n"
        f"Duration: {payload['duration']}\n"
        f"Budget: {payload['budget']}\n"
        f"Themes: {payload['themes']}\n"
        f"Notes: {payload.get('notes', '')}\n"
        "Keep the route practical and avoid unsuitable stops for the health conditions."
    )
    try:
        message = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1200,
            temperature=0.4,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "\n".join(
            block.text for block in message.content if getattr(block, "type", "") == "text"
        ).strip()
        parsed = json.loads(text)
        if isinstance(parsed, list) and parsed:
            return parsed
    except Exception:
        return fallback_stops
    return fallback_stops
