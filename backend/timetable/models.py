from django.db import models

class TimetableDataset(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('ARCHIVED', 'Archived'),
    ]
    name = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    created_by = models.ForeignKey('auth.User', null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.status})"

class Semester(models.Model):
    dataset = models.ForeignKey(TimetableDataset, on_delete=models.CASCADE, related_name='semesters')
    name = models.CharField(max_length=50)

    class Meta:
        unique_together = ('dataset', 'name')

    def __str__(self):
        return self.name

class Course(models.Model):
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='courses')
    canonical_name = models.CharField(max_length=150)

    class Meta:
        unique_together = ('semester', 'canonical_name')

    def __str__(self):
        return f"{self.canonical_name} ({self.semester.name})"

class Section(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=50)

    class Meta:
        unique_together = ('course', 'name')

    def __str__(self):
        return f"{self.course.canonical_name} - {self.name}"

class Schedule(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='schedules')
    
    # Preserves EXACT original course_name string from JSON, ensuring zero data loss
    source_course_name = models.CharField(max_length=150) 
    
    instructor = models.CharField(max_length=150)
    day = models.CharField(max_length=20)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=50)
    schedule_type = models.CharField(max_length=20) # e.g. "THEORY" or "LAB"

    class Meta:
        # Prevents exact duplicates while allowing multi-period labs
        unique_together = ('section', 'day', 'start_time', 'end_time', 'room', 'instructor', 'source_course_name')

    def __str__(self):
        return f"{self.source_course_name} [{self.day} {self.start_time}-{self.end_time}]"
