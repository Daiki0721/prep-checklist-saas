from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .ai_service import AIServiceError, generate_prep_from_notes
from .models import ChecklistItem, PrepSheet
from .serializers import (
    ChecklistItemSerializer,
    GeneratePrepRequestSerializer,
    PrepSheetSerializer,
)


class PrepSheetListCreateView(APIView):
    ## GET /api/prep-sheets/ 一覧取得, POST /api/prep-sheets/ 新規作成

    def get(self, request):
        # prefetch_related("items") で関連するChecklistItemをまとめて取得し、N+1クエリを防ぐ
        sheets = PrepSheet.objects.prefetch_related("items").all()
        serializer = PrepSheetSerializer(sheets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PrepSheetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sheet = serializer.save()
        return Response(PrepSheetSerializer(sheet).data, status=status.HTTP_201_CREATED)


class PrepSheetDetailView(APIView):
    ## GET / PATCH / DELETE /api/prep-sheets/<pk>/"""

    def _get_object(self, pk: int) -> PrepSheet:
        return get_object_or_404(PrepSheet.objects.prefetch_related("items"), pk=pk)

    def get(self, request, pk: int):
        sheet = self._get_object(pk)
        return Response(PrepSheetSerializer(sheet).data, status=status.HTTP_200_OK)

    def patch(self, request, pk: int):
        sheet = self._get_object(pk)
        # partial=True を指定すると、送られてきた項目（例: organized_notes だけ）だけを部分更新できる
        serializer = PrepSheetSerializer(sheet, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(PrepSheetSerializer(sheet).data, status=status.HTTP_200_OK)

    def delete(self, request, pk: int):
        sheet = self._get_object(pk)
        sheet.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GeneratePrepSheetView(APIView):
    ## POST /api/prep-sheets/generate/ 雑多なメモからAIでPrepSheet＋ChecklistItemを生成・保存"""

    def post(self, request):
        req_serializer = GeneratePrepRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)

        raw_input = req_serializer.validated_data["raw_input"]
        requested_title = req_serializer.validated_data.get("title", "").strip()

        try:
            ai_result = generate_prep_from_notes(
                raw_notes=raw_input,
                title=requested_title or None,
            )
        except AIServiceError as exc:
            return Response(
                {"detail": str(exc)},
                status=exc.status_code,
            )

        final_title = requested_title or ai_result.title or "Untitled Prep Sheet"

        # transaction.atomic() を使うことで、途中でDBエラーが起きても中途半端なデータがDBに残らない
        with transaction.atomic():
            sheet = PrepSheet.objects.create(
                title=final_title,
                raw_input=raw_input,
                organized_notes=ai_result.organized_notes,
            )

            # bulk_create でチェックリスト項目をまとめてINSERT（DBへの往復回数を減らせる）
            item_instances = [
                ChecklistItem(
                    prep_sheet=sheet,
                    category=item.category or "General",
                    task=item.task,
                    quantity=item.quantity,
                    priority=item.priority,
                    notes=item.notes,
                    is_completed=False,
                    order=index,
                )
                for index, item in enumerate(ai_result.items, start=1)
            ]
            ChecklistItem.objects.bulk_create(item_instances)

        # リレーション（items）を含めた最新状態でシリアライズして返す
        sheet_with_items = PrepSheet.objects.prefetch_related("items").get(pk=sheet.pk)
        return Response(
            PrepSheetSerializer(sheet_with_items).data,
            status=status.HTTP_201_CREATED,
        )


class ChecklistItemDetailView(APIView):
    ## PATCH / DELETE /api/checklist-items/<pk>/"""

    def patch(self, request, pk: int):
        item = get_object_or_404(ChecklistItem, pk=pk)
        serializer = ChecklistItemSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk: int):
        item = get_object_or_404(ChecklistItem, pk=pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
