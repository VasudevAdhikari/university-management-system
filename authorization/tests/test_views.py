from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch, MagicMock
import json

class ViewsTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        # Mock the Student model
        self.student_patcher = patch('authorization.views.Student')
        self.mock_student = self.student_patcher.start()
        # Mock the OTP model
        self.otp_patcher = patch('authorization.views.OTP')
        self.mock_otp = self.otp_patcher.start()

    def tearDown(self):
        self.student_patcher.stop()
        self.otp_patcher.stop()

    def test_login_view(self):
        response = self.client.get(reverse('login'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'htmls/login.html')

    def test_register_view(self):
        response = self.client.get(reverse('register'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'htmls/register.html')

    @patch('authorization.views.send_mail')
    def test_verify_mail(self, mock_send_mail):
        # Mock Student.objects.filter().exists()
        self.mock_student.objects.filter.return_value.exists.return_value = False
        
        # Mock OTP.objects.create()
        mock_otp_instance = MagicMock()
        self.mock_otp.objects.create.return_value = mock_otp_instance
        
        # Mock send_mail
        mock_send_mail.return_value = 1

        response = self.client.post(
            reverse('verify_mail'),
            json.dumps({'email': 'test@example.com'}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'OTP sent successfully to your email')

    def test_verify_otp(self):
        # Mock OTP.objects.get()
        mock_otp = MagicMock()
        mock_otp.otp = '123456'
        self.mock_otp.objects.get.return_value = mock_otp

        response = self.client.post(
            reverse('verify_otp'),
            json.dumps({
                'email': 'test@example.com',
                'otp': '123456'
            }),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['verified'])

    @patch('authorization.views.Student.objects.create')
    def test_save_student(self, mock_create):
        mock_create.return_value = MagicMock()
        
        form_data = {
            'email': 'newstudent@example.com',
            'first_name': 'New',
            'last_name': 'Student',
            'password': 'newpassword123',
            'phone': '1234567890',
            'telegram_username': '@newstudent',
            'outlook_email': 'newstudent@edu.mm'
        }
        
        response = self.client.post(
            reverse('save_student'),
            form_data
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success'])

    @patch('authorization.views.EmergencyContact.objects.create')
    def test_save_emergency_contact(self, mock_create):
        mock_create.return_value = MagicMock()
        
        contact_data = {
            'name': 'Emergency Contact',
            'phone': '9876543210',
            'email': 'emergency@example.com'
        }
        
        response = self.client.post(
            reverse('save_emergency_contact'),
            json.dumps(contact_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data['success']) 