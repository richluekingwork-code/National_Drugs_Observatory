from django.contrib import admin
from .models import *


# Register your models here.
admin.site.register(LegalReview)
admin.site.register(InformationRequest)
admin.site.register(CourtCase)
admin.site.register(CourtHearing)
admin.site.register(CourtOrder)
admin.site.register(Fine)
admin.site.register(FinePayment)
admin.site.register(Appeal)