from django.urls import path
from .views import (
    ChecklistItemDetailView,
    GeneratePrepSheetView,
    PrepSheetDetailView,
    PrepSheetListCreateView,
)

urlpatterns = [
    path("prep-sheets/", PrepSheetListCreateView.as_view(), name="prep-sheet-list-create"),
    path("prep-sheets/generate/", GeneratePrepSheetView.as_view(), name="prep-sheet-generate"),
    path("prep-sheets/<int:pk>/", PrepSheetDetailView.as_view(), name="prep-sheet-detail"),
    path("checklist-items/<int:pk>/", ChecklistItemDetailView.as_view(), name="checklist-item-detail"),
]