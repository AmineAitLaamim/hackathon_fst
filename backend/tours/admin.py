from django.contrib import admin

from tours.models import Tour, TourInvitation, TourShare

admin.site.register(Tour)
admin.site.register(TourShare)
admin.site.register(TourInvitation)

# Register your models here.
