from django.contrib import admin
from .models import (
    ChildAdultAssessment, FollowUpVisit, FamilyTracingVerification,
    BeneficiaryVerification, BeneficiaryHandover, TracingActionTaken,
    CommunityOutreachReport, CaseClosure,
)
for m in (ChildAdultAssessment, FollowUpVisit, FamilyTracingVerification,
          BeneficiaryVerification, BeneficiaryHandover, TracingActionTaken,
          CommunityOutreachReport, CaseClosure):
    admin.site.register(m)
