import markdown
import re
import bleach
from bleach.sanitizer import ALLOWED_TAGS, ALLOWED_ATTRIBUTES
from pygments import highlight
from pygments.lexers import get_lexer_by_name, TextLexer
from pygments.formatters import HtmlFormatter

from django.db import models
from django.utils.text import slugify
from files.models import File, Folder
from projects.models import Project

class Note(models.Model):
    """
    Notes associated with files for studying and understanding code.
    Supports LaTeX formatting and code snippets.
    """
    # Link to a specific file (optional - might want project/folder level notes too)
    file = models.OneToOneField(
        File, 
        on_delete=models.CASCADE, 
        related_name='note',
        null=True,
        blank=True,
    )
    
    # Link to a folder (optional - for folder-level documentation)
    folder = models.OneToOneField(
        Folder,
        on_delete=models.CASCADE,
        related_name='note',
        null=True, 
        blank=True,
    )
    
    # Link to a project (optional - for project-level documentation)
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name='note',
        null=True,
        blank=True,
    )
    
    # The actual note content in Markdown/LaTeX format
    content = models.TextField(
        help_text="Supports Markdown, LaTeX math ($$...$$), and code blocks (```language ...```)"
    )
    
    # Cached rendered HTML for performance
    rendered_html = models.TextField(blank=True, null=True)
    
    # Title for the note (auto-generated if not provided)
    title = models.CharField(max_length=255, blank=True)
    
    # Slug for URL friendly names
    slug = models.SlugField(max_length=255, blank=True)
    
    # Tracking fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            # Ensure note is associated with exactly one of: file, folder, or project
            models.CheckConstraint(
                check=(
                    models.Q(file__isnull=False, folder__isnull=True, project__isnull=True) |
                    models.Q(file__isnull=True, folder__isnull=False, project__isnull=True) |
                    models.Q(file__isnull=True, folder__isnull=True, project__isnull=False)
                ),
                name='note_has_one_parent'
            )
        ]
        indexes = [
            # Add indexes for the common lookup patterns
            models.Index(fields=['file']),
            models.Index(fields=['folder']),
            models.Index(fields=['project']),
        ]
    
    def __str__(self):
        if self.title:
            return self.title
        elif self.file:
            return f"Note: {self.file.name}"
        elif self.folder:
            return f"Note: {self.folder.name} (folder)"
        else:
            return f"Note: {self.project.name} (project)"
    
    def save(self, *args, **kwargs):
        # Auto-generate title from file/folder/project if not provided
        if not self.title:
            if self.file:
                self.title = f"Notes on {self.file.name}"
            elif self.folder:
                self.title = f"Notes on {self.folder.name} folder"
            elif self.project:
                self.title = f"Notes on {self.project.name} project"
        
        # Generate slug if not provided
        if not self.slug:
            self.slug = slugify(self.title)

        if self.content:
            # Render the content to HTML
            self.render_content()

            
        
        # Here you could add code to render the HTML from markdown/LaTeX
        # self.rendered_html = some_rendering_function(self.content)
        
        super().save(*args, **kwargs)


    def render_content(self):
        """
        Render markdown content with LaTeX and code highlighting to HTML
        """
        # Enhanced allowed tags for markdown, math, and code highlighting
        allowed_tags = ALLOWED_TAGS + [
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