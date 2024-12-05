# api/models/user.py

import bcrypt
from django.db import models
import uuid

class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=128)  # Store hashed passwords
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        # Generate a salt and hash the password
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(raw_password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, raw_password):
        return bcrypt.checkpw(raw_password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def __str__(self):
        return self.email

    @property
    def is_authenticated(self):
        """Always returns True. This is a way to tell if the user is authenticated."""
        return True

    @property
    def is_anonymous(self):
        """Always returns False. This is a way to tell if the user is anonymous."""
        return False
