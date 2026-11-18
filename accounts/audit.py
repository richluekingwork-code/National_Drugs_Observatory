from .models import UserActivityLog


def create_user_activity_log(
    user,
    action,
    ip_address=None,
    device_info=None,
    location=None,
):
    institution = None

    if user is not None:
        membership = user.institution_memberships.filter(
            is_active=True,
            institution__is_active=True,
        ).select_related("institution").first()

        if membership:
            institution = membership.institution

    return UserActivityLog.objects.create(
        user=user,
        institution=institution,
        action=action,
        ip_address=ip_address,
        device_info=device_info,
        location=location,
    )