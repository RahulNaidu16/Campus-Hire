from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Skill, StudentSkill, User
from .serializers import (
    CampusTokenObtainPairSerializer,
    RegisterSerializer,
    SkillSerializer,
    UserSerializer,
)


class CampusTokenObtainPairView(TokenObtainPairView):
    serializer_class = CampusTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        data = request.data

        profile_fields = [
            "first_name", "last_name", "email", "university", "branch",
            "cgpa", "bio", "resume_text", "graduation_year", "company_name",
        ]
        for field in profile_fields:
            if field in data:
                setattr(user, field, data[field])
        user.save()

        if "skills" in data and isinstance(data["skills"], list):
            StudentSkill.objects.filter(student=user).delete()
            for entry in data["skills"]:
                if isinstance(entry, str):
                    name, level = entry, 70
                else:
                    name = entry.get("name") or entry.get("skill")
                    level = entry.get("level", 70)
                if not name:
                    continue
                skill, _ = Skill.objects.get_or_create(name__iexact=name, defaults={"name": name})
                StudentSkill.objects.update_or_create(
                    student=user, skill=skill, defaults={"level": level}
                )

        return Response(UserSerializer(user).data)


class SkillListView(generics.ListAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
