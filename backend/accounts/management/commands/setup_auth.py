from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, User
import getpass

class Command(BaseCommand):
    help = 'Creates required auth groups and sets up an initial admin account.'

    def handle(self, *args, **options):
        self.stdout.write('Creating roles (Groups)...')
        admin_group, _ = Group.objects.get_or_create(name='Admin')
        student_group, _ = Group.objects.get_or_create(name='Student')
        self.stdout.write(self.style.SUCCESS('Groups created/verified.'))

        # Ask to create admin if one doesn't exist in the Admin group
        if not User.objects.filter(groups=admin_group).exists():
            self.stdout.write('No Admin users found. Let\'s create one.')
            username = input('Admin Username: ')
            email = input('Admin Email: ')
            password = getpass.getpass('Admin Password: ')
            
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.ERROR(f'User {username} already exists!'))
            else:
                user = User.objects.create_superuser(username=username, email=email, password=password)
                user.groups.add(admin_group)
                self.stdout.write(self.style.SUCCESS(f'Successfully created admin user: {username}'))
        else:
            self.stdout.write(self.style.SUCCESS('Admin user already exists. Setup complete.'))
