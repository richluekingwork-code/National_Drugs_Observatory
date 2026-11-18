class Roles:
    ADMIN = "institution_admin"
    DEPT_HEAD = "department_head"
    DATA_OFFICER = "data_officer"
    # ANALYST = "analyst"
    # VIEWER = "viewer"

    # Who may write LDEA records.
    CAN_WRITE = frozenset({ADMIN, DEPT_HEAD, DATA_OFFICER})
    CAN_ADMIN = frozenset({ADMIN})