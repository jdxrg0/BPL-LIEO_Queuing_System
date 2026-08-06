import zipfile
import re
import sys

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as z:
            xml_content = z.read('word/document.xml').decode('utf-8')
            text = re.sub('<w:p[^>]*>', '\n', xml_content)
            text = re.sub('<[^>]+>', '', text)
            print(text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    extract_text_from_docx(sys.argv[1])
