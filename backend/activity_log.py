from supabase_client import supabase


def log_action(actor_id: str, action: str, resource_type: str = None, resource_id: str = None, severity: str = "info"):
    """
    Records an action into the activity_logs table safely.

    Args:
        actor_id (str): The user ID who performed the action.
        action (str): What happened, e.g. "logged_in", "file_uploaded".
        resource_type (str): What kind of item was affected, e.g. "file", "share_link".
        resource_id (str): ID of the specific file/link involved.
        severity (str): "info", "warn", or "alert".

    Returns:
        dict: The inserted log row or None.
    """
    data = {
        "actor_id": actor_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "severity": severity,
    }

    try:
        response = supabase.table("activity_logs").insert(data).execute()
        print("Activity logged:", action)
        return response.data
    except Exception as e:
        print("Activity logging notice:", e)
        return None


if __name__ == "__main__":
    test_user_id = "411869a7-34d1-4ad8-8f15-c569cdf6e2b2"

    log_action(
        actor_id=test_user_id,
        action="test_event",
        resource_type="system",
        severity="info"
    )