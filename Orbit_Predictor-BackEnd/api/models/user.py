# api/models/user.py

import bcrypt
from django.db import models
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, role='user', **extra_fields):
        """
        Creates and saves a User with the given email, password, and role.
        """
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        if password:
            user.set_password(password)
        else:
            raise ValueError('The Password field must be set')
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, role='admin', **extra_fields):
        """
        Creates and saves a superuser with the given email, password, and role.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if role != 'admin':
            raise ValueError('Superuser must have role of Admin.')
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, role, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('collision_analyst', 'Collision Analyst'),
        ('user', 'User'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='user')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Required for admin access
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    # Override set_password and check_password to use bcrypt
    def set_password(self, raw_password):
        """
        Hashes the password using bcrypt and stores it.
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(raw_password.encode('utf-8'), salt)
        self.password = hashed.decode('utf-8')

    def check_password(self, raw_password):
        """
        Checks the password against the stored hash.
        """
        return bcrypt.checkpw(raw_password.encode('utf-8'), self.password.encode('utf-8'))
