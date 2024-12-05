from rest_framework.schemas.openapi import SchemaGenerator

class CustomSchemaGenerator(SchemaGenerator):
    def get_schema(self, request=None, public=False):
        return super().get_schema(request=request, public=public)