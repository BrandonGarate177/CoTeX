from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from apps.accounts.serializers import UserSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from functools import wraps

# Email verification decorator
def email_verified_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.profile.is_email_verified:
            return Response(
                {"error": "Email verification required", "verified": False},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return _wrapped_view

# Class-based decorator
def require_email_verification():
    """
    Class decorator for APIView to verify email
    Usage: @require_email_verification()
           class MyView(APIView):
               ...
    """
    def decorator(cls):
        original_dispatch = cls.dispatch
        
        @wraps(original_dispatch)
        def new_dispatch(self, request, *args, **kwargs):
            if request.user.is_authenticated and not request.user.profile.is_email_verified:
                return Response(
                    {"error": "Email verification required", "verified": False},
                    status=status.HTTP_403_FORBIDDEN
                )
            return original_dispatch(self, request, *args, **kwargs)
        
        cls.dispatch = new_dispatch
        return cls
    
    return decorator


## SIGNUPS
class RegisterView(APIView):
    """View for registering new users"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            # Send verification email
            self.send_verification_email(user)
            
            return Response({
                "user": serializer.data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "Verification email has been sent to your email address."
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def send_verification_email(self, user):
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Build verification link (similar to password reset)
        verification_link = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/verify-email/{uid}/{token}/"
        
        # Send email with verification link
        subject = "Verify your email address for CoTeX"
        message = f"""
        Hi {user.username},
        
        Please verify your email address by clicking the link below:
        
        {verification_link}
        
        If you didn't create this account, you can safely ignore this email.
        
        Thanks,
        The CoTeX Team
        """
        
        try:
            send_mail(
                subject,
                message,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cotex.com'),
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log the error but don't stop registration
            print(f"Failed to send verification email: {str(e)}")

# Add new email verification views
class EmailVerificationView(APIView):
    """View for verifying user emails"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, uidb64, token):
        try:
            # Decode the user id
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
            
            # Verify token
            if default_token_generator.check_token(user, token):
                # Mark email as verified
                user.profile.is_email_verified = True
                user.profile.save()
                
                return Response({"message": "Email verified successfully"})
            else:
                return Response(
                    {"error": "Invalid or expired verification link"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid verification link"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
class ResendVerificationEmailView(APIView):
    """View for resending verification emails"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Check if already verified
        if user.profile.is_email_verified:
            return Response(
                {"message": "Your email is already verified"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate token and send email
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Build verification link
        verification_link = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}/verify-email/{uid}/{token}/"
        
        # Send email with verification link
        subject = "Verify your email address for CoTeX"
        message = f"""
        Hi {user.username},
        
        Please verify your email address by clicking the link below:
        
        {verification_link}
        
        If you didn't create this account, you can safely ignore this email.
        
        Thanks,
        The CoTeX Team
        """
        
        try:
            send_mail(
                subject,
                message,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cotex.com'),
                [user.email],
                fail_silently=False,
            )
            return Response({"message": "Verification email sent"})
        except Exception as e:
            return Response(
                {"error": f"Failed to send email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


### LOGIN
class LoginView(APIView):
    """View for logging in users"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            serializer = UserSerializer(user)
            refresh = RefreshToken.for_user(user)
            
            # Include email verification status in response
            return Response({
                "user": serializer.data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "email_verified": user.profile.is_email_verified
            })
        else:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

# Example of using the decorator with a function-based view
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@email_verified_required
def get_user_info(request):
    """Get the currently authenticated user's information"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

# Example of using the decorator with a class-based view
@require_email_verification()
class ProtectedView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # This will only execute if email is verified
        return Response({"message": "You have access to this protected resource"})