from django.core.management.base import BaseCommand

from mlengine.placement_model import train_and_save


class Command(BaseCommand):
    help = "Train (or retrain) the placement-probability ML model and save it to disk."

    def handle(self, *args, **options):
        self.stdout.write("Training placement probability model on synthetic data...")
        metrics = train_and_save()
        self.stdout.write(self.style.SUCCESS(
            f"Done. train_accuracy={metrics['train_accuracy']} "
            f"test_accuracy={metrics['test_accuracy']} n_samples={metrics['n_samples']}"
        ))
