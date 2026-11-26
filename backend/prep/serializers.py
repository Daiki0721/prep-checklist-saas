from rest_framework import serializers
from .models import ChecklistItem, PrepSheet


class ChecklistItemSerializer(serializers.ModelSerializer):
    ##チェックリスト1件分のシリアライザ（取得・作成・更新に使用）

    class Meta:
        model = ChecklistItem
        fields = [
            "id",
            "prep_sheet",
            "category",
            "task",
            "quantity",
            "priority",
            "notes",
            "is_completed",
            "order",
        ]
        # prep_sheet はURLや親シートから紐づけるため、リクエスト側では必須にしない
        read_only_fields = ["id"]
        extra_kwargs = {
            "prep_sheet": {"required": False},
        }


class PrepSheetSerializer(serializers.ModelSerializer):
    ##仕込みシート本体＋紐づくチェックリスト一覧をまとめて扱うシリアライザ

    # PrepSheetのモデルには `items` フィールドはないが、
    # ChecklistItem側の `related_name="items"` を使って子要素をネスト（入れ子）で含められる
    items = ChecklistItemSerializer(many=True, read_only=True)

    class Meta:
        model = PrepSheet
        fields = [
            "id",
            "title",
            "raw_input",
            "organized_notes",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class GeneratePrepRequestSerializer(serializers.Serializer):
    
    ##AI生成エンドポイント（POST /api/prep-sheets/generate/）専用の入力検証シリアライザ。
    ##DBモデルに直接紐づかない入力を受け取るときは `serializers.Serializer` を使う。

    title = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    raw_input = serializers.CharField(allow_blank=False)

    def validate_raw_input(self, value: str) -> str:
        # 空白や改行だけの入力を弾くカスタムバリデーション
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Kitchen notes cannot be empty.")
        return cleaned
