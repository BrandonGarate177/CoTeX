import os
import subprocess
import tempfile
import shutil
from django.conf import settings

class LatexCompiler:
    def __init__(self):
        # Create a base directory for temporary files if needed
        self.base_dir = getattr(settings, 'LATEX_TEMP_DIR', '/tmp/cotex')
        os.makedirs(self.base_dir, exist_ok=True)
    
    def compile_latex(self, main_tex_content, related_files=None):
        """
        Compile LaTeX content to PDF
        
        Args:
            main_tex_content (str): Content of the main .tex file
            related_files (dict): Dict of {filename: content} for additional files
            
        Returns:
            tuple: (success, result_or_error)
                - If success is True, result is the PDF file content
                - If success is False, result is the error message
        """
        # Create temporary directory
        temp_dir = tempfile.mkdtemp(dir=self.base_dir)
        
        try:
            # Write main tex file
            main_file_path = os.path.join(temp_dir, 'main.tex')
            with open(main_file_path, 'w') as f:
                f.write(main_tex_content)
            
            # Write related files
            if related_files:
                for filename, content in related_files.items():
                    # Create subdirectories if needed
                    file_path = os.path.join(temp_dir, filename)
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    
                    with open(file_path, 'w') as f:
                        f.write(content)
            
            # Compile the LaTeX document
            process = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode', 'main.tex'],
                cwd=temp_dir,
                capture_output=True,
                text=True
            )
            
            # Run it twice for references and citations
            if process.returncode == 0:
                subprocess.run(
                    ['pdflatex', '-interaction=nonstopmode', 'main.tex'],
                    cwd=temp_dir,
                    capture_output=True,
                    text=True
                )
            
            # Check if compilation succeeded
            if process.returncode == 0:
                pdf_path = os.path.join(temp_dir, 'main.pdf')
                if os.path.exists(pdf_path):
                    with open(pdf_path, 'rb') as f:
                        pdf_content = f.read()
                    return True, pdf_content
                else:
                    return False, "PDF file was not created"
            else:
                return False, process.stderr
                
        except Exception as e:
            return False, str(e)
        finally:
            # Clean up
            shutil.rmtree(temp_dir)