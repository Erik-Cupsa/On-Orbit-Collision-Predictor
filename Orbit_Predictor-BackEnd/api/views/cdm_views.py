from rest_framework import generics, viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from ..models import CDM
from ..serializers import CDMSerializer
from ..permissions import IsAdmin, CanViewCDM

class CDMSerializerListCreateView(generics.ListCreateAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sat1_object_designator', 'sat2_object_designator']

class CDMCalcDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CDM.objects.all()
    serializer_class = CDMSerializer

class CDMViewSet(viewsets.ModelViewSet):
    serializer_class = CDMSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdmin]  # Only admins can create, update, or delete
        elif self.action in ['list', 'retrieve']:
            permission_classes = [CanViewCDM]  # Custom permission for viewing
        else:
            permission_classes = [permissions.IsAuthenticated]  # Default
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'collision_analyst']:
            return CDM.objects.all()
        elif user.role == 'user':
            return CDM.objects.filter(privacy=True)
        return CDM.objects.none()

class CDMCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data

        # Create or update the CDM entry
        cdm, created = CDM.objects.update_or_create(
            message_id=data['MESSAGE_ID'],
            defaults={
                "ccsds_cdm_version": data.get("CCSDS_CDM_VERS"),
                "creation_date": data.get("CREATION_DATE"),
                "originator": data.get("ORIGINATOR"),
                "tca": data.get("TCA"),
                "miss_distance": float(data.get("MISS_DISTANCE", 0)),

                # Satellite 1 details
                "sat1_object": data.get("SAT1_OBJECT"),
                "sat1_object_designator": data.get("SAT1_OBJECT_DESIGNATOR"),
                "sat1_maneuverable": data.get("SAT1_MANEUVERABLE"),
                "sat1_x": float(data.get("SAT1_X", 0)),
                "sat1_y": float(data.get("SAT1_Y", 0)),
                "sat1_z": float(data.get("SAT1_Z", 0)),
                "sat1_x_dot": float(data.get("SAT1_X_DOT", 0)),
                "sat1_y_dot": float(data.get("SAT1_Y_DOT", 0)),
                "sat1_z_dot": float(data.get("SAT1_Z_DOT", 0)),

                # Covariance matrix for Satellite 1
                "sat1_cov_rr": float(data.get("SAT1_CR_R", 0)),
                "sat1_cov_rt": float(data.get("SAT1_CT_R", 0)),
                "sat1_cov_rn": float(data.get("SAT1_CN_R", 0)),
                "sat1_cov_tr": float(data.get("SAT1_CR_T", 0)),
                "sat1_cov_tt": float(data.get("SAT1_CT_T", 0)),
                "sat1_cov_tn": float(data.get("SAT1_CN_T", 0)),
                "sat1_cov_nr": float(data.get("SAT1_CR_N", 0)),
                "sat1_cov_nt": float(data.get("SAT1_CT_N", 0)),
                "sat1_cov_nn": float(data.get("SAT1_CN_N", 0)),

                # Satellite 2 details
                "sat2_object": data.get("SAT2_OBJECT"),
                "sat2_object_designator": data.get("SAT2_OBJECT_DESIGNATOR"),
                "sat2_maneuverable": data.get("SAT2_MANEUVERABLE"),
                "sat2_x": float(data.get("SAT2_X", 0)),
                "sat2_y": float(data.get("SAT2_Y", 0)),
                "sat2_z": float(data.get("SAT2_Z", 0)),
                "sat2_x_dot": float(data.get("SAT2_X_DOT", 0)),
                "sat2_y_dot": float(data.get("SAT2_Y_DOT", 0)),
                "sat2_z_dot": float(data.get("SAT2_Z_DOT", 0)),

                # Covariance matrix for Satellite 2
                "sat2_cov_rr": float(data.get("SAT2_CR_R", 0)),
                "sat2_cov_rt": float(data.get("SAT2_CT_R", 0)),
                "sat2_cov_rn": float(data.get("SAT2_CN_R", 0)),
                "sat2_cov_tr": float(data.get("SAT2_CR_T", 0)),
                "sat2_cov_tt": float(data.get("SAT2_CT_T", 0)),
                "sat2_cov_tn": float(data.get("SAT2_CN_T", 0)),
                "sat2_cov_nr": float(data.get("SAT2_CR_N", 0)),
                "sat2_cov_nt": float(data.get("SAT2_CT_N", 0)),
                "sat2_cov_nn": float(data.get("SAT2_CN_N", 0)),

                # Hard Body Radius (if present in JSON data)
                "hard_body_radius": float(data.get("HBR", 0)),

                "privacy": data.get("privacy", False)
            }
        )

        action = "Created" if created else "Updated"
        return Response({"message": f"{action} CDM entry with MESSAGE_ID: {cdm.message_id}"}, status=status.HTTP_201_CREATED)