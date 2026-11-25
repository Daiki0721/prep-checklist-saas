# Create your models here.
from django.conf import settings
from django.db import models


class PrepSheet(models.Model):
    ## 1回分の仕込みシート（雑多なメモ・整理済みメモ・チェックリストの親）

    # settings.AUTH_USER_MODEL を使うと、将来カスタムユーザーモデルに変えても安全
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="prep_sheets",
        null=True,
        blank=True,  # Phase 2のAPI動作確認段階では未ログインでもテストしやすくするため一旦許可
    )
    title = models.CharField(max_length=200)
    raw_input = models.TextField(help_text="ユーザーが入力した元の仕込みメモ")
    organized_notes = models.TextField(
        blank=True,
        help_text="AIが整理した全体メモ・申し送り（ユーザーが編集可能）",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # 新しい仕込みシートが上に来るように並べる
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.created_at:%Y-%m-%d})"


class ChecklistItem(models.Model):
    ##仕込みシートに紐づく個別のチェックリスト項目

    class Priority(models.TextChoices):
        HIGH = "high", "High"
        NORMAL = "normal", "Normal"

    prep_sheet = models.ForeignKey(
        PrepSheet,
        on_delete=models.CASCADE,
        related_name="items",  # sheet.items.all() のように逆参照できる
    )
    category = models.CharField(max_length=100, default="General")
    task = models.CharField(max_length=255)
    quantity = models.CharField(max_length=50, blank=True)
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL,
    )
    notes = models.CharField(max_length=255, blank=True)
    is_completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        # 登録・生成された順番（order → id）で安定して並ぶようにする
        ordering = ["order", "id"]

    def __str__(self) -> str:
        status = "✓" if self.is_completed else " "
        return f"[{status}] {self.task}"
