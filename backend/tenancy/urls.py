from django.urls import path

from tenancy import views


urlpatterns = [
    path("auth/csrf/", views.csrf, name="auth-csrf"),
    path("auth/signup/", views.signup, name="auth-signup"),
    path("auth/login/", views.login_view, name="auth-login"),
    path("auth/logout/", views.logout_view, name="auth-logout"),
    path("auth/me/", views.me, name="auth-me"),
    path("auth/bootstrap-workspace/", views.bootstrap_workspace, name="auth-bootstrap-workspace"),
]
