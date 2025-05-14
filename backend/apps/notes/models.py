import markdown
import re
import bleach
from bleach.sanitizer import ALLOWED_TAGS, ALLOWED_ATTRIBUTES
from pygments import highlight
from pygments.lexers import get_lexer_by_name, TextLexer
from pygments.formatters import HtmlFormatter

from django.db import models
from django.utils.text import slugify
from apps.files.models import File, Folder
from apps.projects.models import Project

class Note(models.Model):
    """
    Notes associated with files for studying and understanding code.
    Supports LaTeX formatting and code snippets.
    """
    title = models.CharField(max_length=255, blank=True)
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='notes', null=True, blank=True)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='notes', null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='notes', null=True, blank=True)
    path = models.CharField(max_length=255, null=True, blank=True)  # Store the file path in the git repo
    slug = models.SlugField(max_length=255, blank=True, unique=True)
    content = models.TextField(blank=True)
    rendered_html = models.TextField(blank=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Add this field

    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        if self.file:
            return f"Note for {self.file.name}"
        elif self.folder:
            return f"Note for folder {self.folder.name}"
        elif self.project:
            return f"Note for project {self.project.name}"
        elif self.path:
            import os
            return f"Note for {os.path.basename(self.path)}"
        return f"Note {self.id}"

    def save(self, *args, **kwargs):
        # Generate slug if not provided
        if not self.slug:
            # Base the slug on the associated entity or a timestamp
            if self.file:
                base = f"note-{self.file.name}"
            elif self.folder:
                base = f"note-{self.folder.name}"
            elif self.project:
                base = f"note-{self.project.name}"
            else:
                import time
                base = f"note-{int(time.time())}"
            self.slug = slugify(base)
    
        if self.content:
            # Render the content to HTML
            self.render_content()

    def render_content(self):
        """
        Render markdown content with LaTeX and code highlighting to HTML
        """
        # Enhanced allowed tags for markdown, math, and code highlighting
        allowed_tags = list(ALLOWED_TAGS) + [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'span',
            'pre', 'code', 'blockquote', 'hr', 'br', 'img',
            'table', 'thead', 'tbody', 'tr', 'th', 'td', 
            'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'sup', 'sub'
        ]
        
        allowed_attrs = dict(ALLOWED_ATTRIBUTES)
        allowed_attrs['code'] = ['class']
        allowed_attrs['pre'] = ['class']
        allowed_attrs['div'] = ['class']
        allowed_attrs['span'] = ['class', 'style']
        allowed_attrs['img'] = ['src', 'alt', 'title']
        
        # Process code blocks before markdown
        def replace_code_blocks(match):
            language = match.group(1) or 'text'
            code = match.group(2)
            
            try:
                lexer = get_lexer_by_name(language)
            except:
                lexer = TextLexer()
                
            formatter = HtmlFormatter(style='default')
            highlighted = highlight(code, lexer, formatter)
            return f'<div class="code-block">{highlighted}</div>'
        
        # Replace triple backtick code blocks
        content_with_code = re.sub(
            r'```(?P<lang>\w+)?\n(?P<code>.*?)```', 
            replace_code_blocks, 
            self.content, 
            flags=re.DOTALL
        )
        
        # Convert markdown to HTML
        html = markdown.markdown(
            content_with_code,
            extensions=[
                'markdown.extensions.fenced_code',
                'markdown.extensions.tables',
                'markdown.extensions.nl2br'
            ]
        )
        
        # Process LaTeX
        def replace_latex(match):
            math = match.group(1)
            return f'<span class="latex-math">$${math}$$</span>'
        
        html_with_math = re.sub(r'\$\$(.*?)\$\$', replace_latex, html, flags=re.DOTALL)
        
        # Sanitize HTML
        clean_html = bleach.clean(
            html_with_math,
            tags=allowed_tags,
            attributes=allowed_attrs,
            strip=True
        )
        
        self.rendered_html = clean_html
        return clean_html


class NoteTag(models.Model):
    """Tags for organizing and filtering notes"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class NoteTagging(models.Model):
    """Many-to-many relationship between Notes and Tags"""
    note = models.ForeignKey(Note, on_delete=models.CASCADE, related_name='taggings')
    tag = models.ForeignKey(NoteTag, on_delete=models.CASCADE, related_name='taggings')
    
    class Meta:
        unique_together = [['note', 'tag']]