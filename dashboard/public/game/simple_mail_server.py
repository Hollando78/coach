#!/usr/bin/env python3
import smtpd
import asyncore
import base64
import os
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders

class CustomSMTPServer(smtpd.SMTPServer):
    def process_message(self, peer, mailfrom, rcpttos, data, **kwargs):
        print(f"Receiving message from: {peer}")
        print(f"Message from: {mailfrom}")
        print(f"Message for: {rcpttos}")
        print(f"Message data: {len(data)} bytes")
        
        # Save message to file
        with open('received_message.eml', 'wb') as f:
            f.write(data.encode() if isinstance(data, str) else data)
        print("Message saved to received_message.eml")

def create_email_with_attachment(file_path, recipient_email="user@example.com"):
    """Create an email with game files attached"""
    msg = MIMEMultipart()
    msg['From'] = "game-server@localhost"
    msg['To'] = recipient_email
    msg['Subject'] = "Dragon Game Files"
    
    # Email body
    body = """
    Attached are the dragon game files with enhanced beast sprites:
    
    - world.html: Main game file with all enhancements
    - index.html: Entry point
    - README.md: Documentation
    
    The game features:
    - Enhanced beast anatomy (torso, hips, midsection)
    - Improved ear positioning and animations
    - Detailed claws, teeth, and tail features
    - Hierarchical sprite structure
    
    Open world.html in a web browser to play!
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    # Attach tar.gz file
    if os.path.exists(file_path):
        with open(file_path, "rb") as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
        
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename= dragon-game.tar.gz'
        )
        msg.attach(part)
    
    return msg

def start_smtp_server(port=1025):
    """Start local SMTP server"""
    print(f"Starting SMTP server on port {port}")
    print("This server will receive emails but cannot send to external addresses")
    
    server = CustomSMTPServer(('localhost', port), None)
    print(f"SMTP server listening on localhost:{port}")
    
    try:
        asyncore.loop()
    except KeyboardInterrupt:
        print("SMTP server stopped")

if __name__ == "__main__":
    print("Dragon Game Mail Server")
    print("=" * 30)
    print("1. Starting local SMTP server...")
    print("2. Creating email with game files...")
    
    # Create email with attachment
    email = create_email_with_attachment("dragon-game.tar.gz")
    
    # Save email to file
    with open("game-files-email.eml", "w") as f:
        f.write(email.as_string())
    
    print("Email with game files created: game-files-email.eml")
    print("You can download this .eml file and open it in your email client")
    
    # Start server (this will run indefinitely)
    start_smtp_server()