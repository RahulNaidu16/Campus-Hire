from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Skill, StudentSkill, User


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name"]


class StudentSkillSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="skill.name", read_only=True)
    skill_id = serializers.PrimaryKeyRelatedField(source="skill", queryset=Skill.objects.all(), write_only=True, required=False)

    class Meta:
        model = StudentSkill
        fields = ["id", "skill_id", "name", "level"]


class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of the logged in user, including skills."""

    skills = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    company_id = serializers.IntegerField(source="company.id", read_only=True, default=None)
    has_resume_file = serializers.SerializerMethodField()
    resume_file_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", "full_name",
            "role", "university", "branch", "cgpa", "bio", "resume_text",
            "graduation_year", "company_name", "company_id", "skills", "date_joined",
            "is_staff", "is_superuser", "has_resume_file", "resume_file_name",
        ]
        read_only_fields = ["id", "username", "role", "date_joined", "is_staff", "is_superuser"]

    def get_skills(self, obj):
        links = obj.student_skills.select_related("skill").all()
        return StudentSkillSerializer(links, many=True).data

    def get_has_resume_file(self, obj):
        return bool(obj.resume_file)

    def get_resume_file_name(self, obj):
        return obj.resume_file.name.split("/")[-1] if obj.resume_file else None

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    username = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=[User.ROLE_STUDENT, User.ROLE_RECRUITER], default=User.ROLE_STUDENT)
    university = serializers.CharField(required=False, allow_blank=True)
    skills = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = User
        fields = [
            "username", "email", "password", "first_name", "last_name",
            "role", "university", "company_name", "branch", "skills",
        ]

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if not attrs.get("username"):
            base = (attrs.get("email") or "user").split("@")[0].lower()
            base = "".join(ch for ch in base if ch.isalnum()) or "user"
            candidate = base
            suffix = 1
            while User.objects.filter(username__iexact=candidate).exists():
                suffix += 1
                candidate = f"{base}{suffix}"
            attrs["username"] = candidate
        elif User.objects.filter(username__iexact=attrs["username"]).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        return attrs

    def create(self, validated_data):
        skill_names = validated_data.pop("skills", [])
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        for name in skill_names:
            name = name.strip()
            if not name:
                continue
            skill, _ = Skill.objects.get_or_create(name__iexact=name, defaults={"name": name})
            StudentSkill.objects.get_or_create(student=user, skill=skill, defaults={"level": 70})

        if user.role == User.ROLE_RECRUITER and user.company_name.strip():
            from jobs.models import Company
            company, _ = Company.objects.get_or_create(
                name__iexact=user.company_name.strip(),
                defaults={"name": user.company_name.strip()},
            )
            user.company = company
            user.save(update_fields=["company"])

        return user


class CampusTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends the default JWT serializer to accept email OR username, and to
    embed basic user info alongside the access/refresh tokens."""

    def validate(self, attrs):
        login = attrs.get(self.username_field)
        if login and "@" in login:
            try:
                user = User.objects.get(email__iexact=login)
                attrs[self.username_field] = user.get_username()
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
