# ==============================================================================
# FlyNova-ResQ: High-Altitude Aerial Drone YOLO Fine-Tuning Pipeline
# ==============================================================================
# Use this script to fine-tune YOLOv8 / YOLO26 on aerial drone datasets (VisDrone)
# or your own college drone flight footage.
#
# Can be run locally (if you have an NVIDIA GPU) or on Google Colab (Free T4 GPU).
# ==============================================================================

import os
import sys
from ultralytics import YOLO

def train_aerial_model(
    base_model='yolov8s.pt',    # 'yolov8n.pt' or 'yolov8s.pt'
    dataset='VisDrone.yaml',    # Built-in Ultralytics VisDrone dataset or 'custom_college.yaml'
    epochs=30,                  # 30-50 epochs is ideal for fine-tuning
    imgsz=1024,                 # CRITICAL: 1024/1280 preserves tiny 15px humans at altitude
    batch=8,                    # Adjust based on GPU VRAM (8 for 8GB VRAM, 16 for 16GB)
    name='flynova_aerial_drone'
):
    print(f'Starting Aerial Drone Fine-Tuning...')
    print(f'Base Model: {base_model}')
    print(f'Dataset:    {dataset}')
    print(f'Resolution: {imgsz}x{imgsz} (Optimized for High-Altitude Tiny Pedestrians)')
    print(f'Epochs:     {epochs}')

    # Load pre-trained weights
    model = YOLO(base_model)

    # Train model
    results = model.train(
        data=dataset,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        name=name,
        patience=10,
        save=True,
        device=0 if os.environ.get('CUDA_VISIBLE_DEVICES') else 'cpu',
        # Aerial augmentation parameters:
        scale=0.5,              # Random multi-scale scaling
        fliplr=0.5,             # Horizontal flip
        mosaic=1.0              # Mosaic augmentation for small object detection
    )

    print('\nTraining Complete!')
    best_weights = os.path.join('runs', 'detect', name, 'weights', 'best.pt')
    print(f'Best weights saved at: {best_weights}')

    # Export to ONNX for Qualcomm / WebGL deployment
    print('\nExporting to ONNX format...')
    onnx_path = model.export(format='onnx', imgsz=imgsz, dynamic=True)
    print(f'ONNX exported to: {onnx_path}')
    print('\nYou can drop this .pt or .onnx directly into FlyNova-ResQ Dashboard!')

if __name__ == '__main__':
    train_aerial_model()
