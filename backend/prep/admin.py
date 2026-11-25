from django.contrib import admin
from .models import ChecklistItem, PrepSheet


class ChecklistItemInline(admin.TabularInline):
    ## PrepSheetの詳細画面の中でChecklistItemを一覧・編集できるようにする

    model = ChecklistItem
    extra = 0
    fields = ("order", "category", "task", "quantity", "priority", "is_completed", "notes")


@admin.register(PrepSheet)
class PrepSheetAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "user", "created_at", "updated_at")
    search_fields = ("title", "raw_input", "organized_notes")
    list_filter = ("created_at",)
    inlines = [ChecklistItemInline]


@admin.register(ChecklistItem)
class ChecklistItemAdmin(admin.ModelAdmin):
    list_display = ("id", "prep_sheet", "category", "task", "quantity", "priority", "is_completed")
    list_filter = ("priority", "is_completed", "category")
    search_fields = ("task", "notes")
