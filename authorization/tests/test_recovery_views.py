from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch, MagicMock
import json

class RecoveryViewsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        # Mock the Student model
        self.student_patcher = patch('authorization.recovery_views.Student')
        self.mock_student = self.student_patcher.start()
        # Mock the OTP model
        self.otp_patcher = patch('authorization.recovery_views.OTP')
        self.mock_otp = self.otp_patcher.start()
        # Mock the LoginAttempt model
        self.login_attempt_patcher = patch('authorization.recovery_views.LoginAttempt')
        self.mock_login_attempt = self.login_attempt_patcher.start()

    def tearDown(self):
        self.student_patcher.stop()
        self.otp_patcher.stop()
        self.login_attempt_patcher.stop()

    def test_recovery_view(self):
        response = self.client.get(reverse('recovery'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'htmls/recovery.html')

    def test_otp_login_view(self):
        response = self.client.get(reverse('otp_login'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'htmls/otp_login.html')

    def test_credential_login_view(self):
        response = self.client.get(reverse('credential_login'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'htmls/credential_login.html')

    def test_emergency_contact_login_view(self):
        response = self.client.get(reverse('emergency_contact_login'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'htmls/emergency_contact_login.html')

    def test_check_email(self):
        # Mock Student.objects.filter().exists()
        self.mock_student.objects.filter.return_value.exists.return_value = True

        response = self.client.post(
            reverse('recovery_check_email'),
            json.dumps({'email': 'test@example.com'}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['exists'])

    @patch('authorization.recovery_views.send_mail')
    def test_send_otp(self, mock_send_mail):
        # Mock OTP.objects.create()
        mock_otp_instance = MagicMock()
        self.mock_otp.objects.create.return_value = mock_otp_instance
        
        # Mock send_mail
        mock_send_mail.return_value = 1

        response = self.client.post(
            reverse('send_otp'),
            json.dumps({'email': 'test@example.com'}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

    def test_credential_login(self):
        # Mock Student.objects.get()
        mock_student = MagicMock()
        mock_student.password = 'testpassword123'
        self.mock_student.objects.get.return_value = mock_student

        response = self.client.post(
            reverse('credential_login_submit'),
            json.dumps({
                'email': 'test@example.com',
                'password': 'testpassword123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

    def test_new_password_view(self):
        response = self.client.get(reverse('new_password', args=['test@example.com']))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'htmls/new_password.html')

    def test_change_password(self):
        # Mock Student.objects.get()
        mock_student = MagicMock()
        self.mock_student.objects.get.return_value = mock_student

        response = self.client.post(
            reverse('change_password'),
            json.dumps({
                'email': 'test@example.com',
                'password': 'newpassword123'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success']) 