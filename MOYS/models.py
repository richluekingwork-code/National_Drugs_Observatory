from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from core.models import InstitutionScoped 
from LDEA.models import LogInVictims


# =============================================================
#    AT-RISK YOUTH IDENTIFICATION & REFERRAL FORM
# =============================================================
class MYSReferral(InstitutionScoped):
    """
    Ministry of Youth and Sports (MYS) Referral Model.
    Inherits multi-tenancy (institution), audit trails (created_by, updated_by), 
    and soft-deletes (record_state) from InstitutionScoped.
    """
     
    # REFERRAL SOURCE
    REFERRAL_SOURCE_CHOICES = [
        ("family", "Family"),
        ("community", "Community"),
        ("moh", "MOH - Ministry of Health"),
        ("moj", "MOJ - Ministry of Justice"),
        ("mgcsp", "MGCSP - Ministry of Gender, Children and Social Protection"),
        ("police", "Police"),
        ("ngo_cso", "NGO / CSO"),
        ("other", "Other"),
    ]
     
    # REASONS FOR REFERRAL
    REFERRAL_REASON_CHOICES = [
        ("substance_use", "Substance-use concern"),
        ("vulnerability", "Vulnerability"),
        ("street_involvement", "Street involvement"),
        ("conflict_with_law", "Conflict with the law"),
        ("unemployment", "Unemployment"),
        ("school_dropout", "School dropout"),
        ("family_related", "Family-related concern"),
        ("other", "Other"),
    ]

    # MYS ACTION
    MYS_ACTION_CHOICES = [
        ("referral_received", "Referral received"),
        ("referral_made", "Referral made"),
        ("follow_up_required", "Follow-up required"),
    ]

    # REFERRAL STATUS
    REFERRAL_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("closed", "Closed"),
    ]

    # IDENTIFICATION
    referral_id = models.CharField(max_length=50, unique=True, blank=True, null=True, help_text="Unique referral identification number.")
    date_of_referral = models.DateField(default=timezone.localdate, db_index=True)

    # REFERRAL SOURCE
    referral_source = models.CharField(max_length=20, choices=REFERRAL_SOURCE_CHOICES)
    referring_institution_person = models.CharField(max_length=255, help_text="Name of the referring institution or person.")
    referring_contact = models.CharField(max_length=100, blank=True, help_text="Contact number or other contact details.")

    # REASON FOR REFERRAL
    reason_for_referral = models.TextField(help_text="Explain why the individual is being referred.")
    immediate_concern_identified = models.TextField(blank=True, help_text="Describe any immediate concern identified.")

    # Multiple reasons can be selected.
    reasons_for_referral = models.JSONField(default=list, blank=True, help_text="Select one or more reasons for referral.")
    other_reason_details = models.TextField(blank=True, help_text="Specify other reason(s) for referral.")

    # BENEFICIARY INVOLVED
    persons = models.ManyToManyField(LogInVictims, related_name="moys_referrals", blank=True)
     
    # MYS ACTION
    action_taken = models.CharField(max_length=30, choices=MYS_ACTION_CHOICES)
    referred_to = models.CharField(max_length=255, blank=True, help_text="Institution, organization or service referred to.")
    date_referred = models.DateField(null=True, blank=True)

    # MYS OFFICER INFORMATION
    mys_officer = models.CharField(max_length=200, help_text="Name of the MYS officer handling the referral.")
    officer_signature = models.CharField(max_length=200, blank=True, help_text="Name or signature reference of the MYS officer.")
    signature_reference = models.CharField(max_length=255, help_text="Signature reference or details.")
    referral_status = models.CharField(max_length=20, choices=REFERRAL_STATUS_CHOICES, default="pending", db_index=True)

    class Meta: # type: ignore
        verbose_name = "MYS Referral"
        verbose_name_plural = "MYS Referrals"
        ordering = ["-date_of_referral", "-created_at"]
        indexes = [
            models.Index(fields=["institution", "-date_of_referral"], name="mys_ref_inst_date_idx"),
            models.Index(fields=["referral_status"], name="mys_ref_status_idx"),
        ]

    def clean(self):
        super().clean()
        errors = {}
        valid_reasons = {choice[0] for choice in self.REFERRAL_REASON_CHOICES}

        if not isinstance(self.reasons_for_referral, list):
            errors["reasons_for_referral"] = "Referral reasons must be submitted as a list."
        elif not all(isinstance(reason, str) and reason in valid_reasons for reason in self.reasons_for_referral):
            errors["reasons_for_referral"] = "One or more selected referral reasons are invalid."

        if self.date_referred and self.date_of_referral and self.date_referred < self.date_of_referral:
            errors["date_referred"] = "Date referred cannot be earlier than date of referral."

        if isinstance(self.reasons_for_referral, list) and "other" in self.reasons_for_referral and not self.other_reason_details.strip():
            errors["other_reason_details"] = "Please specify the other reason for referral."

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.referral_id or 'Unassigned'} - {self.referring_institution_person}"


# =============================================================
#     REFERRAL RECEIPT & DISPOSITION FORM
# =============================================================
class ReceiptDisposition(InstitutionScoped):
    """
    Receipt and Disposition of a referral (MYS).
    Inherits multi-tenancy (institution), audit trails (created_by, updated_by), 
    and soft-deletes (record_state) from InstitutionScoped.
    """
    REFERRAL_REASON_CHOICES = [
        ('substance_use', 'Substance Use'),
        ('vulnerability', 'Vulnerability'),
        ('street_involvement', 'Street Involvement'),
        ('conflict_with_law', 'Conflict with the Law'),
        ('unemployment', 'Unemployment'),
        ('school_dropout', 'School Dropout'),
        ('family_related', 'Family Related'),
        ('other', 'Other'),
    ]

    DISPOSITION_CHOICES = [
        ('accepted', 'Accepted for MYS Intervention'),
        ('referred', 'Referred to Another Institution'),
        ('returned', 'Returned for Additional Information'),
        ('pending', 'Pending Assessment'),
        ('other', 'Other'),
    ]

    YES_NO_CHOICES = [
        ('yes', 'Yes'),
        ('no', 'No'),
    ]

    # A. Referral     
    referral_id = models.CharField(max_length=50, unique=True, help_text="Unique receipt and disposition reference number.")
    beneficiary_ID = models.CharField(max_length=50, unique=True, help_text="Unique beneficiary_ID reference number.")
    date_received = models.DateField()
    referring_institution = models.CharField(max_length=255)
    referring_officer = models.CharField(max_length=255)
    reason_for_referral = models.CharField(max_length=100, choices=REFERRAL_REASON_CHOICES)

    # BENEFICIARY INVOLVED
    persons = models.ManyToManyField(LogInVictims, related_name="moys_receipt_dispositions", blank=True)
          
    # B. Referral Information Received
    background_information_provided = models.CharField(max_length=3, choices=YES_NO_CHOICES, default='no')
    supporting_documents_provided = models.CharField(max_length=3, choices=YES_NO_CHOICES, default='no')
    previous_service_received = models.CharField(max_length=3, choices=YES_NO_CHOICES, default='no')
    previous_institution_facility = models.CharField(max_length=255, blank=True)

    # C. MYS Disposition
    disposition = models.CharField(max_length=20, choices=DISPOSITION_CHOICES)
    receiving_referral_institution = models.CharField(max_length=255, blank=True)
    reason_for_disposition = models.TextField()
    disposition_date = models.DateField()
    responsible_mys_officer = models.CharField(max_length=255)
    other_disposition_details = models.TextField(blank=True)

    class Meta: # type: ignore
        verbose_name = "Receipt & Disposition"
        verbose_name_plural = "Receipt & Dispositions"
        ordering = ['-date_received', '-created_at']
        indexes = [
            models.Index(fields=['institution', 'date_received'], name='mys_receipt_inst_date_idx'),
            models.Index(fields=['disposition'], name='mys_receipt_disp_idx'),
        ]

    def clean(self):
        super().clean()

        if self.disposition_date and self.date_received:
            if self.disposition_date < self.date_received:
                raise ValidationError({
                    'disposition_date': 'Disposition date cannot be earlier than the date received.'
                })

        if self.disposition == 'referred' and not self.receiving_referral_institution:
            raise ValidationError({
                'receiving_referral_institution': 'Please specify the institution receiving the referral.'
            })

        if self.disposition == 'other' and not self.other_disposition_details:
            raise ValidationError({
                'other_disposition_details': 'Please provide details for the other disposition.'
            })

    def __str__(self):
        # FIXED: Changed self.receipt_reference to self.referral_id (which is the actual field name)
        return f"{self.referral_id} - {self.get_disposition_display()}" # type: ignore

# =============================================================
#     MYS PRE-TREATMENT/REINTEGRATION PREPARATION FORM
# =============================================================   
class MYSPreTreatmentReintegration(InstitutionScoped):
     """
     MYS Pre-Treatment / Reintegration Preparation Model.
     Inherits multi-tenancy (institution), audit trails, and soft-deletes.
     """

     STATUS_CHOICES = [
          ('identified', 'Identified'),
          ('planned', 'Planned'),
          ('contacted', 'Contacted'),
          ('approved', 'Approved'),
          ('pending', 'Pending'),
          ('in_progress', 'In Progress'),
          ('completed', 'Completed'),
          ('not_suitable', 'Not Suitable'),
          ('cancelled', 'Cancelled'),
     ]

     SUITABILITY_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
          ('pending', 'Pending Assessment'),
     ]

     # A. Beneficiary
     beneficiary = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name='moys_reintegration_preparations')
     preparation_id = models.CharField(max_length=50, unique=True, help_text="Unique MYS preparation reference ID.")
     treatment_rehabilitation_facility = models.CharField(max_length=255)
     date_admitted = models.DateField()

     # B. Planning & Coordination
     # B1. Communication with rehabilitation facility
     facility_communications = models.JSONField(default=list, blank=True, help_text=(
               "List of communication records: date, facility/officer "
               "contacted, purpose and outcome."
          )
     )

     # B2. Skills opportunities identified
     skills_opportunities = models.JSONField(default=list, blank=True, help_text=(
               "List of skills opportunities: opportunity, institution/provider, "
               "suitability and status."
          )
     )

     # B3. Youth development programmes identified
     youth_development_programmes = models.JSONField(default=list, blank=True, help_text=(
               "List of programmes: programme, provider, proposed participation "
               "and status."
          )
     )

     # B4. Sports/Recreation Planning
     sports_recreation_activities = models.JSONField(default=list, blank=True, help_text=(
               "List of activities: activity, provider/location, "
               "proposed date and status."
          )
     )

     # B5. Family/Community Coordination
     family_community_coordination = models.JSONField(default=list, blank=True, help_text=(
               "List of coordination records: date, person/structure, "
               "purpose and outcome."
          )
     )

     # C. Transition Preparation
     proposed_mys_intervention = models.TextField(help_text="Proposed MYS intervention after treatment.")
     mys_officer = models.CharField(max_length=255)
     preparation_date = models.DateField()

     # MODEL SETTINGS
     class Meta: # pyright: ignore[reportIncompatibleVariableOverride]
          verbose_name = "MYS Pre-Treatment/Reintegration Preparation"
          verbose_name_plural = "MYS Pre-Treatment/Reintegration Preparations"
          ordering = ['-preparation_date', '-created_at']

          indexes = [
               models.Index(
                    fields=['institution', 'preparation_date'],
                    name='mys_prep_inst_date_idx'
               ),
               models.Index(
                    fields=['date_admitted'],
                    name='mys_prep_admit_date_idx'
               ),
          ]

     # VALIDATION
     def clean(self):
          super().clean()

          if (
               self.preparation_date
               and self.date_admitted
               and self.preparation_date < self.date_admitted
          ):
               raise ValidationError({
                    'preparation_date':
                         'Preparation date cannot be earlier than the admission date.'
               })

          if not isinstance(self.facility_communications, list):
               raise ValidationError({
                    'facility_communications':
                         'Communication records must be provided as a list.'
               })

          if not isinstance(self.skills_opportunities, list):
               raise ValidationError({
                    'skills_opportunities':
                         'Skills opportunities must be provided as a list.'
               })

          if not isinstance(self.youth_development_programmes, list):
               raise ValidationError({
                    'youth_development_programmes':
                         'Youth development programmes must be provided as a list.'
               })

          if not isinstance(self.sports_recreation_activities, list):
               raise ValidationError({
                    'sports_recreation_activities':
                         'Sports and recreation activities must be provided as a list.'
               })

          if not isinstance(self.family_community_coordination, list):
               raise ValidationError({
                    'family_community_coordination':
                         'Family/community coordination records must be provided as a list.'
               })

     def __str__(self):
          return f"{self.preparation_id} - {self.beneficiary}"   

# =============================================================
#     ARYEP REGISTRATION & ENROLMENT FORM
# =============================================================     
class ARYEPRegistration(InstitutionScoped):

     SEX_CHOICES = [
          ('male', 'Male'),
          ('female', 'Female'),
          ('other', 'Other'),
     ]
     
     
     INTERVENTION_PATHWAY_CHOICES = [
          ('tvet', 'TVET'),
          ('life_skills', 'Life Skills'),
          ('entrepreneurship', 'Entrepreneurship'),
          ('employment', 'Employment'),
          ('apprenticeship', 'Apprenticeship'),
          ('sports', 'Sports'),
          ('leadership', 'Leadership'),
          ('civic_engagement', 'Civic Engagement'),
          ('digital_skills', 'Digital Skills'),
          ('financial_literacy', 'Financial Literacy'),
          ('other', 'Other'),
     ]

     # A. Registration
     aryep_id = models.CharField(max_length=50, unique=True, help_text="AR-YEP Beneficiary ID.")
     
     registration_date = models.DateField()
     referral_id = models.CharField(max_length=50, blank=True)
     referral_source = models.CharField(max_length=255)
     previous_treatment_facility = models.CharField(max_length=255, blank=True)
     discharge_transition_date = models.DateField(null=True, blank=True)
     
     # This FK creates the database column 'beneficiary_id'
     beneficiary = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name='aryep_registrations', null=True,  blank=True)
          
     # C. AR-YEP Programme
     programme_site = models.CharField(max_length=255)
     intervention_pathways = models.JSONField(default=list, blank=True, help_text="Select one or more AR-YEP intervention pathways.")
     other_intervention_details = models.CharField(max_length=255, blank=True)
     assigned_mys_officer = models.CharField(max_length=255)

     # MODEL SETTINGS
     class Meta: # type: ignore
          verbose_name = "AR-YEP Registration & Enrolment"
          verbose_name_plural = "AR-YEP Registrations & Enrolments"
          ordering = ['-registration_date', '-created_at']

          indexes = [
               models.Index(
                    fields=['institution', 'registration_date'],
                    name='aryep_inst_reg_date_idx'
               ),
               # FIXED: Removed county and district indexes since those fields were deleted
          ]

     # VALIDATION
     def clean(self):
          super().clean()

          # FIXED: Removed the self.age check because age now lives on self.beneficiary.age

          if (
               self.discharge_transition_date
               and self.registration_date
               and self.discharge_transition_date > self.registration_date
          ):
               raise ValidationError({
                    'discharge_transition_date':
                         'Discharge/transition date cannot be after registration date.'
               })

          if not isinstance(self.intervention_pathways, list):
               raise ValidationError({
                    'intervention_pathways':
                         'Intervention pathways must be provided as a list.'
               })

          valid_pathways = {
               choice[0] for choice in self.INTERVENTION_PATHWAY_CHOICES
          }

          invalid_pathways = set(self.intervention_pathways) - valid_pathways

          if invalid_pathways:
               raise ValidationError({
                    'intervention_pathways':
                         f'Invalid intervention pathways: {", ".join(invalid_pathways)}'
               })

          if (
               'other' in self.intervention_pathways
               and not self.other_intervention_details
          ):
               raise ValidationError({
                    'other_intervention_details':
                         'Please specify the other intervention pathway.'
               })

     def __str__(self):
          # FIXED: Since full_name was removed, we pull it from the beneficiary FK
          name = self.beneficiary.first_name if self.beneficiary else "Unknown"
          return f"{self.aryep_id} - {name}"   
          
# =============================================================
#     INDIVIDUAL YOUTH EMPOWERMENT & REINTEGRATION PLAN
# =============================================================
class IndividualYouthReintegrationPlan(InstitutionScoped):

     PRIORITY_CHOICES = [
          ('high', 'High'),
          ('medium', 'Medium'),
          ('low', 'Low'),
     ]

     NEED_AREA_CHOICES = [
          ('education', 'Education'),
          ('vocational_skills', 'Vocational Skills'),
          ('employment', 'Employment'),
          ('entrepreneurship', 'Entrepreneurship'),
          ('life_skills', 'Life Skills'),
          ('sports_recreation', 'Sports/Recreation'),
          ('digital_skills', 'Digital Skills'),
          ('financial_literacy', 'Financial Literacy'),
          ('leadership_civic_engagement', 'Leadership/Civic Engagement'),
          ('family_community_reintegration', 'Family/Community Reintegration'),
     ]

     INTERVENTION_STATUS_CHOICES = [
          ('planned', 'Planned'),
          ('pending', 'Pending'),
          ('in_progress', 'In Progress'),
          ('completed', 'Completed'),
          ('on_hold', 'On Hold'),
          ('cancelled', 'Cancelled'),
     ]

     # A. Beneficiary
     beneficiary = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name='individual_reintegration_plans')
     plan_reference_id = models.CharField(max_length=50, unique=True, help_text="Beneficiary reference ID for this plan.")
     date_of_plan = models.DateField()
     mys_officer_case_manager = models.CharField(max_length=255)

     # B. Identified Needs
     identified_needs = models.JSONField(default=list, blank=True, help_text="List of identified needs, descriptions and priorities.")

     # C. Individual Intervention Plan
     intervention_activities = models.JSONField(default=list, blank=True, help_text="List of planned interventions, providers, dates and statuses.")
     
     # D. Reintegration Goal
     primary_goal = models.TextField()
     expected_outcome = models.TextField()

     class Meta: # type: ignore
          verbose_name = "Individual Youth Empowerment & Reintegration Plan"
          verbose_name_plural = "Individual Youth Empowerment & Reintegration Plans"
          ordering = ['-date_of_plan', '-created_at']

          indexes = [
               models.Index(
                    fields=['institution', 'date_of_plan'],
                    name='mys_reint_inst_date_idx'
               ),
               models.Index(
                    fields=['beneficiary', 'date_of_plan'],
                    name='mys_reint_ben_date_idx'
               ),
          ]

     def clean(self):
          super().clean()

          if not isinstance(self.identified_needs, list):
               raise ValidationError({
                    'identified_needs':
                         'Identified needs must be provided as a list.'
               })

          if not isinstance(self.intervention_activities, list):
               raise ValidationError({
                    'intervention_activities':
                         'Intervention activities must be provided as a list.'
               })

          valid_areas = {
               choice[0] for choice in self.NEED_AREA_CHOICES
          }

          valid_priorities = {
               choice[0] for choice in self.PRIORITY_CHOICES
          }

          for item in self.identified_needs:
               if not isinstance(item, dict):
                    raise ValidationError({
                         'identified_needs':
                         'Each identified need must be an object.'
                    })

               if item.get('area') not in valid_areas:
                    raise ValidationError({
                         'identified_needs':
                         f"Invalid need area: {item.get('area')}"
                    })

               if item.get('priority') not in valid_priorities:
                    raise ValidationError({
                         'identified_needs':
                         f"Invalid priority: {item.get('priority')}"
                    })

          valid_statuses = {
               choice[0] for choice in self.INTERVENTION_STATUS_CHOICES
          }

          for item in self.intervention_activities:
               if not isinstance(item, dict):
                    raise ValidationError({
                         'intervention_activities':
                         'Each intervention activity must be an object.'
                    })

               if item.get('status') not in valid_statuses:
                    raise ValidationError({
                         'intervention_activities':
                         f"Invalid intervention status: {item.get('status')}"
                    })

               start_date = item.get('start_date')
               end_date = item.get('end_date')

               if start_date and end_date and end_date < start_date:
                    raise ValidationError({
                         'intervention_activities':
                         'Intervention end date cannot be before start date.'
                    })

     def __str__(self):
          # FIXED: Uses plan_reference_id now
          return f"{self.plan_reference_id} - Reintegration Plan"

# ============================================================
#     TVET/SKILLS TRAINING TRACKING FORM
# ============================================================
class TVETSkillsTraining(InstitutionScoped):

     YES_NO_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
     ]

     TRAINING_LEVEL_CHOICES = [
          ('basic', 'Basic'),
          ('intermediate', 'Intermediate'),
          ('advanced', 'Advanced'),
          ('professional', 'Professional'),
          ('other', 'Other'),
     ]

     POST_TRAINING_CHOICES = [
          ('employment', 'Employment'),
          ('apprenticeship', 'Apprenticeship'),
          ('business_startup', 'Business/Start-up'),
          ('further_training', 'Further Training'),
          ('other', 'Other'),
     ]

     # A. Training Information
     beneficiary = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name='tvet_training_records', null=True, blank=True)
     tvet_reference_id = models.CharField(max_length=50, help_text="AR-YEP Beneficiary ID.")
     training_institution = models.CharField(max_length=255)
     trade = models.CharField(max_length=255, help_text="Example: Carpentry, Masonry, Welding, Tailoring.")
     training_level = models.CharField(max_length=20, choices=TRAINING_LEVEL_CHOICES)
     enrollment_date = models.DateField()
     expected_completion = models.DateField()
     actual_completion = models.DateField(null=True, blank=True)

     # B. Attendance & Progress
     attendance_progress = models.JSONField(default=list, blank=True, help_text=(
               "List of reporting periods containing period, attendance, "
               "progress and remarks."
          )
     )

     # C. Completion
     completed_training = models.CharField(max_length=3, choices=YES_NO_CHOICES, default='no')
     certification_obtained = models.CharField(max_length=3, choices=YES_NO_CHOICES, default='no')
     certificate_number = models.CharField(max_length=100, blank=True)
     certificate_date = models.DateField(null=True, blank=True)
     reason_for_non_completion = models.TextField(blank=True)

     # D. Post-Training
     post_training_outcome = models.JSONField(default=list, blank=True, help_text="Select one or more post-training outcomes.")
     other_post_training_details = models.CharField(max_length=255, blank=True)

     class Meta: # type: ignore
          verbose_name = "TVET/Skills Training Tracking"
          verbose_name_plural = "TVET/Skills Training Tracking Records"
          ordering = ['-enrollment_date', '-created_at']

          indexes = [
               models.Index(
                    fields=['institution', 'enrollment_date'],
                    name='tvet_inst_enroll_idx'
               ),
               # FIXED: Changed to index the FK instead of the renamed string field
               models.Index(
                    fields=['beneficiary'],
                    name='tvet_beneficiary_idx'
               ),
          ]

     def clean(self):
          super().clean()

          if (
               self.expected_completion
               and self.enrollment_date
               and self.expected_completion < self.enrollment_date
          ):
               raise ValidationError({
                    'expected_completion':
                         'Expected completion cannot be before enrollment date.'
               })

          if (
               self.actual_completion
               and self.enrollment_date
               and self.actual_completion < self.enrollment_date
          ):
               raise ValidationError({
                    'actual_completion':
                         'Actual completion cannot be before enrollment date.'
               })

          if self.completed_training == 'yes' and not self.actual_completion:
               raise ValidationError({
                    'actual_completion':
                         'Please provide the actual completion date.'
               })

          if (
               self.certification_obtained == 'yes'
               and not self.certificate_number
          ):
               raise ValidationError({
                    'certificate_number':
                         'Please provide the certificate number.'
               })

          if (
               self.completed_training == 'no'
               and not self.reason_for_non_completion
          ):
               raise ValidationError({
                    'reason_for_non_completion':
                         'Please provide the reason for non-completion.'
               })

          if not isinstance(self.attendance_progress, list):
               raise ValidationError({
                    'attendance_progress':
                         'Attendance and progress records must be a list.'
               })

          if not isinstance(self.post_training_outcome, list):
               raise ValidationError({
                    'post_training_outcome':
                         'Post-training outcomes must be a list.'
               })

          valid_outcomes = {
               choice[0] for choice in self.POST_TRAINING_CHOICES
          }

          invalid_outcomes = (
               set(self.post_training_outcome) - valid_outcomes
          )

          if invalid_outcomes:
               raise ValidationError({
                    'post_training_outcome':
                         f'Invalid post-training outcomes: {", ".join(invalid_outcomes)}'
               })

          if (
               'other' in self.post_training_outcome
               and not self.other_post_training_details
          ):
               raise ValidationError({
                    'other_post_training_details':
                         'Please specify the other post-training outcome.'
               })

     def __str__(self):
          # FIXED: Uses the new field name
          return f"{self.tvet_reference_id} - {self.trade}"

# ============================================================
#     YOUTH EMPOWERMENT INTERVENTION RECORD
# ============================================================ 
class MYSYouthIntervention(InstitutionScoped):

     INTERVENTION_TYPE_CHOICES = [
          ('life_skills', 'Life Skills'),
          ('entrepreneurship', 'Entrepreneurship'),
          ('job_readiness', 'Job Readiness'),
          ('sports_development', 'Sports for Development'),
          ('leadership_development', 'Leadership Development'),
          ('civic_engagement', 'Civic Engagement'),
          ('digital_skills', 'Digital Skills'),
          ('financial_literacy', 'Financial Literacy'),
          ('youth_participation', 'Youth Participation'),
     ]

     COMPLETION_STATUS_CHOICES = [
          ('not_started', 'Not Started'),
          ('in_progress', 'In Progress'),
          ('completed', 'Completed'),
          ('partially_completed', 'Partially Completed'),
          ('dropped_out', 'Dropped Out'),
          ('on_hold', 'On Hold'),
     ]

     YES_NO_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
     ]

     # A. Intervention Information
     beneficiary = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name='youth_interventions', null=True, blank=True)
     intervention_reference_id = models.CharField(max_length=50, help_text="AR-YEP Beneficiary ID.")
     intervention_type = models.CharField(max_length=50, choices=INTERVENTION_TYPE_CHOICES)
     provider = models.CharField(max_length=255)
     location = models.CharField(max_length=255)
     start_date = models.DateField()
     end_date = models.DateField()
     number_of_sessions = models.PositiveIntegerField()

     # B. Participation
     sessions_attended = models.PositiveIntegerField(default=0)
     completion_status = models.CharField(max_length=30, choices=COMPLETION_STATUS_CHOICES, default='not_started')
     certificate_issued = models.CharField(max_length=3, choices=YES_NO_CHOICES, default='no')

     # C. Outcome
     outcome_achieved = models.TextField(help_text="Describe what the beneficiary achieved through this intervention.")
     class Meta: # type: ignore
          verbose_name = "MYS Youth Intervention"
          verbose_name_plural = "MYS Youth Interventions"
          ordering = ['-start_date', '-created_at']

          indexes = [
               models.Index(
                    fields=['institution', 'start_date'],
                    name='mys_interv_inst_date_idx'
               ),
               
               models.Index(
                    fields=['beneficiary'],
                    name='mys_interv_beneficiary_idx'
               ),
               models.Index(
                    fields=['completion_status'],
                    name='mys_interv_status_idx'
               ),
          ]

     def clean(self):
          super().clean()

          if self.start_date and self.end_date:
               if self.end_date < self.start_date:
                    raise ValidationError({
                         'end_date': 'End date cannot be earlier than start date.'
                    })

          if self.sessions_attended is not None and self.number_of_sessions is not None:
               if self.sessions_attended > self.number_of_sessions:
                    raise ValidationError({
                         'sessions_attended':
                         'Sessions attended cannot exceed the total number of sessions.'
                    })

          if (
               self.completion_status == 'completed'
               and self.sessions_attended == 0
               and self.number_of_sessions > 0
          ):
               raise ValidationError({
                    'sessions_attended':
                         'A completed intervention must have at least one attended session.'
               })

          if (
               self.certificate_issued == 'yes'
               and self.completion_status != 'completed'
          ):
               raise ValidationError({
                    'certificate_issued':
                         'A certificate should only be issued when the intervention is completed.'
               })

     def __str__(self):
          # FIXED: Using the new field name
          return f"{self.intervention_reference_id} - {self.get_intervention_type_display()}" # type: ignore
     
# ============================================================
#     EMPLOYMENT, APPRENTICESHIP & BUSINESS SUPPORT FORM
# ============================================================     
class MYSEmploymentApprenticeshipBusiness(InstitutionScoped):

     # Employment choices
     EMPLOYMENT_STATUS_CHOICES = [
          ('employed', 'Employed'),
          ('unemployed', 'Unemployed'),
          ('self_employed', 'Self-Employed'),
          ('seasonal', 'Seasonal Employment'),
          ('other', 'Other'),
     ]

     EMPLOYMENT_TYPE_CHOICES = [
          ('permanent', 'Permanent'),
          ('temporary', 'Temporary'),
          ('contract', 'Contract'),
          ('part_time', 'Part-Time'),
          ('full_time', 'Full-Time'),
          ('casual', 'Casual'),
          ('self_employment', 'Self-Employment'),
          ('other', 'Other'),
     ]

     # Apprenticeship choices
     APPRENTICESHIP_OUTCOME_CHOICES = [
          ('completed', 'Completed'),
          ('ongoing', 'Ongoing'),
          ('employed', 'Employed After Apprenticeship'),
          ('self_employed', 'Self-Employed'),
          ('not_completed', 'Not Completed'),
          ('other', 'Other'),
     ]

     # Business choices
     BUSINESS_STATUS_CHOICES = [
          ('operating', 'Operating'),
          ('temporarily_closed', 'Temporarily Closed'),
          ('permanently_closed', 'Permanently Closed'),
     ]

     YES_NO_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
     ]

     # A. Employment / Base Info
     # FIXED: Pointing directly to LDEA's LogInVictims
     beneficiary = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name='employment_apprenticeship_business_records', null=True, blank=True)
     emp_record_reference_id = models.CharField(max_length=50, help_text="AR-YEP Beneficiary ID.")
     employment_status = models.CharField(max_length=30, choices=EMPLOYMENT_STATUS_CHOICES, blank=True)
     employer = models.CharField(max_length=255, blank=True)
     employment_sector = models.CharField(max_length=150, blank=True)
     job_title = models.CharField(max_length=150, blank=True)
     employment_start_date = models.DateField(null=True, blank=True)
     employment_type = models.CharField(max_length=30, choices=EMPLOYMENT_TYPE_CHOICES, blank=True)
     current_employment_status = models.CharField(max_length=30, choices=EMPLOYMENT_STATUS_CHOICES, blank=True)

     # B. Apprenticeship
     apprenticeship_provider = models.CharField(max_length=255, blank=True)
     apprenticeship_trade = models.CharField(max_length=255, blank=True)
     apprenticeship_start_date = models.DateField(null=True, blank=True)
     apprenticeship_completion_date = models.DateField(null=True, blank=True)
     apprenticeship_outcome = models.CharField(max_length=30, choices=APPRENTICESHIP_OUTCOME_CHOICES, blank=True)
 
     # C. Business Support
     business_type = models.CharField(max_length=255, blank=True)
     business_location = models.CharField(max_length=255, blank=True)
     startup_support_received = models.TextField(blank=True, help_text="Describe the start-up support received.")
     equipment_toolkit_received = models.TextField(blank=True, help_text="Describe equipment or toolkits received.")
     startup_capital = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, help_text="Enter the start-up capital amount.")
     date_business_started = models.DateField(null=True, blank=True)
     business_current_status = models.CharField(max_length=30, choices=BUSINESS_STATUS_CHOICES, blank=True)
     estimated_income_range = models.CharField(max_length=150, blank=True, help_text="Example: LRD 5,000 - LRD 10,000 per month.")
     number_of_persons_employed = models.PositiveIntegerField(default=0)

     # MODEL SETTINGS
     class Meta: # type: ignore
          verbose_name = "MYS Employment, Apprenticeship & Business Support"
          verbose_name_plural = "MYS Employment, Apprenticeship & Business Support Records"
          ordering = ['-created_at']

          indexes = [
               # FIXED: Indexing the FK 'beneficiary' instead of the renamed string field
               models.Index(
                    fields=['institution', 'beneficiary'],
                    name='mys_emp_inst_ben_idx'
               ),
               models.Index(
                    fields=['employment_status'],
                    name='mys_emp_status_idx'
               ),
               models.Index(
                    fields=['business_current_status'],
                    name='mys_business_status_idx'
               ),
          ]

     # =====================================================
     # VALIDATION
     # =====================================================
     def clean(self):
          super().clean()

          if (
               self.employment_start_date
               and self.apprenticeship_start_date
               and self.apprenticeship_completion_date
               and self.apprenticeship_completion_date < self.apprenticeship_start_date
          ):
               raise ValidationError({
                    'apprenticeship_completion_date':
                         'Apprenticeship completion date cannot be before its start date.'
               })

          if (
               self.startup_capital is not None
               and self.startup_capital < 0
          ):
               raise ValidationError({
                    'startup_capital':
                         'Start-up capital cannot be negative.'
               })

     def __str__(self):
          # FIXED: Uses the new field name
          return f"{self.emp_record_reference_id} - Employment/Business Record"
          
# ============================================================
#     FAMILY & COMMUNITY REINTEGRATION FORM
# ============================================================    
class MYSFamilyCommunityReintegration(InstitutionScoped):
     FAMILY_REUNIFICATION_CHOICES = [
          ('reunited', 'Reunited'),
          ('pending', 'Pending'),
          ('not_applicable', 'Not Applicable'),
     ]

     ACCEPTANCE_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
          ('partial', 'Partial'),
     ]

     YES_NO_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
     ]

     # A. Family Reintegration
     beneficiary = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name='family_community_reintegration_records', null=True, blank=True)
     reintegration_reference_id = models.CharField(max_length=50, help_text="AR-YEP Beneficiary ID")
     family_reunification_status = models.CharField(max_length=20, choices=FAMILY_REUNIFICATION_CHOICES, default='pending')
     date_reunited = models.DateField(null=True, blank=True)
     family_community_location = models.CharField(max_length=255, blank=True)

     # B. Community Reintegration
     accepted_by_family = models.CharField(max_length=10, choices=ACCEPTANCE_CHOICES, blank=True)
     accepted_by_community = models.CharField(max_length=10, choices=ACCEPTANCE_CHOICES, blank=True)
     participating_in_community_activities = models.CharField(max_length=5, choices=YES_NO_CHOICES, blank=True)
     member_of_youth_organization = models.CharField(max_length=5, choices=YES_NO_CHOICES, blank=True)
     member_of_peer_support_group = models.CharField(max_length=5, choices=YES_NO_CHOICES, blank=True)
     participating_in_community_service = models.CharField(max_length=5, choices=YES_NO_CHOICES, blank=True)
     participating_in_leadership_activities = models.CharField(max_length=5, choices=YES_NO_CHOICES, blank=True)

     # C. Social Cohesion
     social_cohesion_activity = models.TextField(blank=True)
     conflict_resolution_activity = models.TextField(blank=True)
     activity_date = models.DateField(null=True, blank=True)
     outcome = models.TextField(blank=True)

     # MODEL SETTINGS
     class Meta: # type: ignore
          ordering = ['-activity_date', '-created_at']
          verbose_name = "MYS Family and Community Reintegration"
          verbose_name_plural = "MYS Family and Community Reintegration"
          indexes = [
               # FIXED: Added a name to the index and pointed it to the ForeignKey 'beneficiary'
               models.Index(
                    fields=['institution', 'beneficiary'], 
                    name='mys_fam_inst_ben_idx'
               ),
               models.Index(
                    fields=['family_reunification_status'],
                    name='mys_fam_status_idx'
               ),
               models.Index(
                    fields=['activity_date'],
                    name='mys_fam_activity_idx'
               ),
          ]

     # =====================================================
     # VALIDATION
     # =====================================================
     def clean(self):
          # FIXED: Added super().clean()
          super().clean()

          errors = {}

          if self.family_reunification_status == 'reunited' and not self.date_reunited:
               errors['date_reunited'] = (
                    "Enter the date the beneficiary was reunited with their family."
               )

          if (
               self.family_reunification_status != 'reunited'
               and self.date_reunited
          ):
               errors['date_reunited'] = (
                    "A reunion date should only be entered when the status is Reunited."
               )

          if errors:
               raise ValidationError(errors)

     def __str__(self):
          # FIXED: Uses the new field name
          return f"{self.reintegration_reference_id} - Family and Community Reintegration"
          
# ============================================================
#     AFTERCARE & FOLLOW-UP FORM
# ============================================================
class MYSReintegrationFollowUp(InstitutionScoped):

     FOLLOW_UP_PERIOD_CHOICES = [
          ('1_month', '1 Month'),
          ('3_months', '3 Months'),
          ('6_months', '6 Months'),
          ('12_months', '12 Months'),
          ('other', 'Other'),
     ]

     STATUS_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
          ('partial', 'Partially'),
     ]

     YES_NO_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
     ]

     CURRENT_STATUS_CHOICES = [
          ('stable', 'Stable'),
          ('progressing', 'Progressing'),
          ('needs_support', 'Needs Support'),
          ('not_applicable', 'Not Applicable'),
     ]

     # A. Beneficiary and Follow-Up Information
     beneficiary = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name='reintegration_follow_ups', null=True, blank=True)
     follow_up_reference_id = models.CharField(max_length=50, help_text="AR-YEP Beneficiary ID")
     follow_up_period = models.CharField(max_length=20, choices=FOLLOW_UP_PERIOD_CHOICES)
     other_follow_up_period = models.CharField(max_length=100, blank=True)
     follow_up_date = models.DateField()

     # B. Current Reintegration Status
     employment_status = models.CharField(max_length=20, choices=CURRENT_STATUS_CHOICES, blank=True)
     business_status = models.CharField(max_length=20, choices=CURRENT_STATUS_CHOICES, blank=True)
     education_status = models.CharField(max_length=20, choices=CURRENT_STATUS_CHOICES, blank=True)
     family_situation_status = models.CharField(max_length=20, choices=CURRENT_STATUS_CHOICES, blank=True)
     community_participation_status = models.CharField(max_length=20, choices=CURRENT_STATUS_CHOICES, blank=True)
     peer_support_status = models.CharField(max_length=20, choices=CURRENT_STATUS_CHOICES, blank=True)
     mentorship_status = models.CharField(max_length=20, choices=CURRENT_STATUS_CHOICES, blank=True)

     # C. Follow-Up Findings
     reintegration_progressing = models.CharField(max_length=10, choices=STATUS_CHOICES, blank=True)
     additional_support_required = models.CharField(max_length=5, choices=YES_NO_CHOICES, blank=True)
     referral_required = models.CharField(max_length=5, choices=YES_NO_CHOICES, blank=True)
     referral_made_to = models.CharField(max_length=255, blank=True)
     referral_date = models.DateField(null=True, blank=True)
     outcome = models.TextField(blank=True)
     follow_up_officer = models.CharField(max_length=255)

     # MODEL SETTINGS
     class Meta: # type: ignore
          ordering = ['-follow_up_date', '-created_at']
          verbose_name = 'MYS Reintegration Follow-Up'
          verbose_name_plural = 'MYS Reintegration Follow-Ups'

          indexes = [
               # FIXED: Indexing the ForeignKey and added required 'name' parameter
               models.Index(
                    fields=['institution', 'beneficiary'], 
                    name='mys_fu_inst_ben_idx'
               ),
               models.Index(
                    fields=['follow_up_date'], 
                    name='mys_fu_date_idx'
               ),
               models.Index(
                    fields=['follow_up_period'], 
                    name='mys_fu_period_idx'
               ),
          ]

     # =====================================================
     # VALIDATION
     # =====================================================
     def clean(self):
          # FIXED: Added super().clean()
          super().clean()

          errors = {}

          if (
               self.follow_up_period == 'other'
               and not self.other_follow_up_period.strip()
          ):
               errors['other_follow_up_period'] = (
                    "Specify the other follow-up period."
               )

          if self.referral_required == 'yes' and not self.referral_made_to.strip():
               errors['referral_made_to'] = (
                    "Enter the institution or organization referred to."
               )

          if self.referral_required == 'no' and (
               self.referral_made_to or self.referral_date
          ):
               errors['referral_made_to'] = (
                    "Referral details should only be entered when a referral is required."
               )

          if self.referral_required == 'no' and self.referral_date:
               errors['referral_date'] = (
                    "Referral date should only be entered when a referral is required."
               )

          if errors:
               raise ValidationError(errors)

     def __str__(self):
          # FIXED: Uses the new field name
          return (
               f"{self.follow_up_reference_id} - "
               f"{self.get_follow_up_period_display()} Follow-Up" # type: ignore
          ) 
 
# ============================================================
#     CASE OUTCOME & CLOSURE FORM
# ============================================================ 
class MYSCaseClosure(InstitutionScoped):

     FINAL_OUTCOME_CHOICES = [
          ('reintegrated', 'Successfully Reintegrated'),
          ('partially_reintegrated', 'Partially Reintegrated'),
          ('referred', 'Referred to Another Institution'),
          ('dropped_out', 'Dropped Out'),
          ('relocated', 'Relocated'),
          ('other', 'Other'),
     ]

     REINTEGRATION_STATUS_CHOICES = [
          ('stable', 'Stable'),
          ('progressing', 'Progressing'),
          ('needs_support', 'Needs Support'),
          ('not_applicable', 'Not Applicable'),
     ]

     YES_NO_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
     ]

     # A. Case Information
     # FIXED: Pointing directly to LDEA's LogInVictims
     beneficiary = models.ForeignKey(LogInVictims, on_delete=models.PROTECT, related_name='mys_case_closures', null=True, blank=True)
     closure_reference_id = models.CharField(max_length=50, help_text="AR-YEP Beneficiary ID.")
     aryep_registration_number = models.CharField(max_length=50, blank=True)
     date_enrolled = models.DateField()
     date_of_closure = models.DateField()

     # B. Final Outcome
     final_outcome = models.CharField(max_length=30, choices=FINAL_OUTCOME_CHOICES)
     other_final_outcome = models.CharField(max_length=255, blank=True)

     # C. Final Assessment
     overall_reintegration_status = models.CharField(max_length=30, choices=REINTEGRATION_STATUS_CHOICES)
     reason_for_closure = models.TextField()
     further_follow_up_required = models.CharField(max_length=5, choices=YES_NO_CHOICES, default='no')

     # D. Responsible Officers
     mys_officer = models.CharField(max_length=255)
     supervisor = models.CharField(max_length=255)

     # MODEL SETTINGS
     class Meta: # type: ignore
          ordering = ['-date_of_closure', '-created_at']
          verbose_name = "MYS Case Closure"
          verbose_name_plural = "MYS Case Closures"
          indexes = [
               models.Index(
                    fields=['institution', 'date_of_closure'],
                    name='mys_closure_inst_date_idx'
               ),
               models.Index(
                    fields=['final_outcome'],
                    name='mys_closure_outcome_idx'
               ),
          ]

     # VALIDATION
     def clean(self):
          super().clean()
          errors = {}

          if (
               self.date_of_closure
               and self.date_enrolled
               and self.date_of_closure < self.date_enrolled
          ):
               errors['date_of_closure'] = (
                    "Closure date cannot be earlier than enrollment date."
               )

          if self.final_outcome == 'other' and not self.other_final_outcome.strip():
               errors['other_final_outcome'] = (
                    "Please specify the other final outcome."
               )

          if errors:
               raise ValidationError(errors)

     def __str__(self):
          return f"{self.closure_reference_id} - Case Closure"
     
# ============================================================
#      MYS PARTNER & SERVICE PROVIDER REGISTRY 
# ============================================================  
class MYSServiceProvider(InstitutionScoped):

     ORGANIZATION_TYPE_CHOICES = [
          ('government', 'Government'),
          ('ngo', 'Non-Governmental Organization (NGO)'),
          ('private', 'Private Organization'),
          ('community_based', 'Community-Based Organization (CBO)'),
          ('faith_based', 'Faith-Based Organization'),
          ('international', 'International Organization'),
          ('other', 'Other'),
     ]

     SERVICE_CATEGORY_CHOICES = [
          ('rehabilitation', 'Rehabilitation'),
          ('tvet', 'TVET'),
          ('employment', 'Employment'),
          ('apprenticeship', 'Apprenticeship'),
          ('entrepreneurship', 'Entrepreneurship'),
          ('sports', 'Sports'),
          ('psychosocial_support', 'Psychosocial Support'),
          ('mentorship', 'Mentorship'),
          ('education', 'Education'),
          ('family_support', 'Family Support'),
          ('community_support', 'Community Support'),
          ('other', 'Other'),
     ]

     TARGET_POPULATION_CHOICES = [
          ('youth', 'Youth'),
          ('children', 'Children'),
          ('women', 'Women'),
          ('men', 'Men'),
          ('persons_with_disabilities', 'Persons with Disabilities'),
          ('general_population', 'General Population'),
          ('other', 'Other'),
     ]

     YES_NO_CHOICES = [
          ('yes', 'Yes'),
          ('no', 'No'),
     ]

     # =====================================================
     # A. Provider Information
     # =====================================================
     provider_id = models.CharField(max_length=50, help_text="Unique Service Provider ID")
     organization_name = models.CharField(max_length=255)
     organization_type = models.CharField(max_length=30, choices=ORGANIZATION_TYPE_CHOICES)
     other_organization_type = models.CharField(max_length=150, blank=True)

     # B. Location
     county = models.CharField(max_length=100)
     district = models.CharField(max_length=100, blank=True)
     community = models.CharField(max_length=150, blank=True)

     # C. Services
     services_offered = models.TextField(help_text="Describe the services provided by this organization.")

     target_population = models.CharField(max_length=40, choices=TARGET_POPULATION_CHOICES, blank=True)

     service_categories = models.JSONField(default=list, blank=True, help_text=(
               "Select service categories. Example: "
               '["rehabilitation", "tvet", "employment"]'
          )
     )
     other_service_category = models.CharField(max_length=255, blank=True)

     # D. Contact Information
     contact_person = models.CharField(max_length=255)
     telephone = models.CharField(max_length=30, blank=True)
     email = models.EmailField(blank=True)

     # E. Referral and Accreditation
     referral_services_available = models.CharField(max_length=5, choices=YES_NO_CHOICES, default='no')
     accreditation_authorization = models.TextField(blank=True, help_text="Enter accreditation or authorization details.")

     # F. Provider Verification
     # inherited from InstitutionScoped as 'status' and 'created_at'.     
     date_last_verified = models.DateField(null=True, blank=True)

     # MODEL SETTINGS
     class Meta: # type: ignore
          ordering = ['organization_name']
          verbose_name = 'MYS Service Provider'
          verbose_name_plural = 'MYS Service Providers'

          constraints = [
               models.UniqueConstraint(
                    fields=['institution', 'provider_id'],
                    name='unique_provider_id_per_institution'
               )
          ]

          indexes = [
               # FIXED: Added the required 'name=' parameter to all indexes
               models.Index(
                    fields=['institution', 'county'], 
                    name='mys_prov_inst_county_idx'
               ),
               models.Index(
                    fields=['organization_type'], 
                    name='mys_prov_org_type_idx'
               ),
               models.Index(
                    fields=['status'], 
                    name='mys_prov_status_idx'
               ),
          ]

     # =====================================================
     # VALIDATION
     # =====================================================
     def clean(self):
          # FIXED: Added super().clean()
          super().clean()

          errors = {}

          if (
               self.organization_type == 'other'
               and not self.other_organization_type.strip()
          ):
               errors['other_organization_type'] = (
                    "Specify the other organization type."
               )

          if not isinstance(self.service_categories, list):
               errors['service_categories'] = (
                    "Service categories must be a list."
               )
          else:
               valid_categories = {
                    choice[0] for choice in self.SERVICE_CATEGORY_CHOICES
               }

               invalid_categories = [
                    category for category in self.service_categories
                    if category not in valid_categories
               ]

               if invalid_categories:
                    errors['service_categories'] = (
                         f"Invalid service categories: {invalid_categories}"
                    )

               if (
                    'other' in self.service_categories
                    and not self.other_service_category.strip()
               ):
                    errors['other_service_category'] = (
                         "Specify the other service category."
                    )

          # FIXED: Compare to self.created_at instead of the removed date_added field.
          # We check self.pk to ensure the record actually exists in the database yet.
          if (
               self.pk and 
               self.date_last_verified 
               and self.created_at 
               and self.date_last_verified < self.created_at.date()
          ):
               errors['date_last_verified'] = (
                    "Verification date cannot be earlier than the date added."
               )

          if errors:
               raise ValidationError(errors)

     def __str__(self):
          return f"{self.provider_id} - {self.organization_name}"