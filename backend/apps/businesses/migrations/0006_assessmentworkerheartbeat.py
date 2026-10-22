from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [("businesses", "0005_assessmentjob")]
    operations = [migrations.CreateModel(name="AssessmentWorkerHeartbeat", fields=[
        ("worker_id", models.CharField(max_length=120, primary_key=True, serialize=False)),
        ("release", models.CharField(max_length=100)),
        ("seen_at", models.DateTimeField(default=django.utils.timezone.now, db_index=True)),
    ])]
