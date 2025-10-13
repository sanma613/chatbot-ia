"""
Email Service
Handles sending email notifications for activities
"""

import logging
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications"""

    def __init__(self):
        # Email configuration from environment variables
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        self.from_name = os.getenv("FROM_NAME", "Sistema de Gestión Académica")

    def send_activity_reminder(
        self, to_email: str, user_name: str, activity: Dict[str, Any]
    ) -> bool:
        """
        Send activity reminder email

        Args:
            to_email: Recipient email address
            user_name: User's name
            activity: Activity data (title, date, time, location, type)

        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            # Parse activity data
            title = activity.get("title", "Actividad")
            date = activity.get("date", "")
            time = activity.get("time", "")
            location = activity.get("location", "No especificada")
            activity_type = activity.get("type", "other")

            # Format date for display
            try:
                date_obj = datetime.fromisoformat(date)
                formatted_date = date_obj.strftime("%d/%m/%Y")
            except:
                formatted_date = date

            # Format time (HH:MM only, without seconds)
            formatted_time = time[:5] if len(time) >= 5 else time

            # Map activity type to Spanish
            type_mapping = {
                "class": "Clase",
                "exam": "Examen",
                "assignment": "Tarea",
                "meeting": "Reunión",
                "other": "Otro",
            }
            type_label = type_mapping.get(activity_type, "Actividad")

            # Create email subject
            subject = f"🔔 Recordatorio: {title} mañana"

            # Create email body (HTML)
            html_body = f"""
            <html>
                <head>
                    <style>
                        body {{
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }}
                        .container {{
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }}
                        .card {{
                            background-color: white;
                            border-radius: 8px;
                            padding: 30px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }}
                        .header {{
                            color: #2563eb;
                            margin-bottom: 20px;
                        }}
                        .activity-info {{
                            background-color: #f3f4f6;
                            border-left: 4px solid #2563eb;
                            padding: 15px;
                            margin: 20px 0;
                        }}
                        .info-row {{
                            margin: 10px 0;
                        }}
                        .label {{
                            font-weight: bold;
                            color: #2563eb;
                        }}
                        .footer {{
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #e5e7eb;
                            color: #6b7280;
                            font-size: 14px;
                        }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <h1 class="header">¡Recordatorio de Actividad!</h1>
                            
                            <p>Hola <strong>{user_name}</strong>,</p>
                            
                            <p>Te recordamos que <strong>mañana</strong> tienes programada la siguiente actividad:</p>
                            
                            <div class="activity-info">
                                <div class="info-row">
                                    <span class="label">📋 Actividad:</span> {title}
                                </div>
                                <div class="info-row">
                                    <span class="label">📅 Fecha:</span> {formatted_date}
                                </div>
                                <div class="info-row">
                                    <span class="label">🕐 Hora:</span> {formatted_time}
                                </div>
                                <div class="info-row">
                                    <span class="label">📍 Ubicación:</span> {location}
                                </div>
                                <div class="info-row">
                                    <span class="label">📝 Tipo:</span> {type_label}
                                </div>
                            </div>
                            
                            <p>¡No la olvides! Prepárate con anticipación.</p>
                            
                            <div class="footer">
                                <p>Saludos,<br>
                                <strong>{self.from_name}</strong></p>
                                
                                <p><em>Este es un correo automático, por favor no respondas a este mensaje.</em></p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            """

            # Create plain text version
            text_body = f"""
Recordatorio: {title}

Hola {user_name},

Te recordamos que mañana tienes programada la siguiente actividad:

📋 Actividad: {title}
📅 Fecha: {formatted_date}
🕐 Hora: {formatted_time}
📍 Ubicación: {location}
📝 Tipo: {type_label}

¡No la olvides!

Saludos,
{self.from_name}

---
Este es un correo automático, por favor no respondas a este mensaje.
            """

            # Send email
            return self._send_email(to_email, subject, html_body, text_body)

        except Exception as e:
            logger.error(f"Error sending activity reminder to {to_email}: {str(e)}")
            return False

    def _send_email(
        self, to_email: str, subject: str, html_body: str, text_body: str
    ) -> bool:
        """
        Internal method to send email via SMTP

        Args:
            to_email: Recipient email
            subject: Email subject
            html_body: HTML version of email body
            text_body: Plain text version of email body

        Returns:
            True if sent successfully
        """
        try:
            # Validate configuration
            if not self.smtp_user or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Email not sent.")
                return False

            # Create message
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            msg["Subject"] = subject

            # Attach both plain text and HTML versions
            part1 = MIMEText(text_body, "plain", "utf-8")
            part2 = MIMEText(html_body, "html", "utf-8")

            msg.attach(part1)
            msg.attach(part2)

            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except smtplib.SMTPAuthenticationError:
            logger.error("SMTP authentication failed. Check credentials.")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error sending email to {to_email}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending email to {to_email}: {str(e)}")
            return False


# Factory function
def get_email_service() -> EmailService:
    """Get an instance of EmailService"""
    return EmailService()
