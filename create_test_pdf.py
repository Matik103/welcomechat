from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_test_pdf(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    c.setFont("Helvetica", 12)
    text = "This is a test PDF document created for text extraction testing."
    c.drawString(72, 720, text)
    c.save()
    print(f"Created PDF file: {filename}")

if __name__ == "__main__":
    create_test_pdf("test.pdf") 