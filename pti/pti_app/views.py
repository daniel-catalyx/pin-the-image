from django.shortcuts import render
from django.http import JsonResponse, FileResponse, HttpResponse
import os
from django.conf import settings
import urllib.parse
import logging

# Get the logger
logger = logging.getLogger(__name__)

def hello_api(request):
    return JsonResponse({"message": "Hello from Django Backend!"})

def serve_annotation_image(request, image_name=None):
    """
    Serve an image for the Image Annotation component.
    If image_name is provided, try to serve that specific image.
    Otherwise, serve the first image found in the dummy_data directory.
    """
    # Extensive debug logging
    logger.info(f"serve_annotation_image called with image_name: {image_name}")
    logger.info(f"BASE_DIR: {settings.BASE_DIR}")
    
    # URL decode the image name to handle spaces and special characters
    if image_name:
        image_name = urllib.parse.unquote(image_name)
    
    # Try multiple possible locations for the dummy_data directory
    possible_paths = [
        os.path.join(settings.BASE_DIR, 'pti_app', 'dummy_data'),
        os.path.join(settings.BASE_DIR, 'dummy_data'),
        os.path.join(settings.BASE_DIR, 'pti', 'pti_app', 'dummy_data'),
        os.path.join(os.path.dirname(settings.BASE_DIR), 'pti_app', 'dummy_data'),
    ]
    
    # Find the first valid directory
    dummy_data_dir = None
    for path in possible_paths:
        logger.info(f"Checking path: {path}")
        if os.path.exists(path) and os.path.isdir(path):
            dummy_data_dir = path
            logger.info(f"Found valid directory: {dummy_data_dir}")
            break
    
    if not dummy_data_dir:
        logger.error("Could not find dummy_data directory in any expected location")
        return HttpResponse("Could not find dummy_data directory", status=500)
    
    # List all files in the directory for debugging
    logger.info("Files in directory:")
    try:
        for file in os.listdir(dummy_data_dir):
            logger.info(f"- {file}")
    except Exception as e:
        logger.error(f"Error listing directory: {str(e)}")
    
    # If no specific image is requested, use the first jpg/png file found
    if not image_name:
        image_files = []
        try:
            for file in os.listdir(dummy_data_dir):
                if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                    image_files.append(file)
        except Exception as e:
            logger.error(f"Error finding images: {str(e)}")
            return HttpResponse(f"Error finding images: {str(e)}", status=500)
        
        if image_files:
            image_name = image_files[0]
            logger.info(f"Selected first image: {image_name}")
        else:
            logger.warning("No image files found in the directory")
            return HttpResponse("No images found in dummy_data directory", status=404)
    
    # Construct the full path to the image
    image_path = os.path.join(dummy_data_dir, image_name)
    logger.info(f"Attempting to serve image at path: {image_path}")
    
    # Check if the file exists
    if not os.path.exists(image_path):
        logger.error(f"Image file not found: {image_path}")
        return HttpResponse(f"Image {image_name} not found at {image_path}", status=404)
    
    if not os.path.isfile(image_path):
        logger.error(f"Path exists but is not a file: {image_path}")
        return HttpResponse(f"Path exists but is not a file: {image_path}", status=404)
    
    # Determine content type based on file extension
    if image_name.lower().endswith('.jpg') or image_name.lower().endswith('.jpeg'):
        content_type = 'image/jpeg'
    elif image_name.lower().endswith('.png'):
        content_type = 'image/png'
    else:
        content_type = 'application/octet-stream'
    
    # Return metadata about the image if requested
    if request.GET.get('metadata') == 'true':
        try:
            file_size = os.path.getsize(image_path)
            return JsonResponse({
                'name': image_name,
                'size': file_size,
                'type': content_type,
                'url': f'/api/annotation-image/{urllib.parse.quote(image_name)}'
            })
        except Exception as e:
            logger.error(f"Error getting file metadata: {str(e)}")
            return HttpResponse(f"Error getting file metadata: {str(e)}", status=500)
    
    # Serve the file
    try:
        logger.info(f"Serving image: {image_name} ({content_type})")
        return FileResponse(open(image_path, 'rb'), content_type=content_type)
    except Exception as e:
        logger.error(f"Error serving file: {str(e)}")
        return HttpResponse(f"Error serving file: {str(e)}", status=500)

def get_available_images(request):
    """
    Return a list of all available images in the dummy_data directory
    """
    logger.info("get_available_images called")
    logger.info(f"BASE_DIR: {settings.BASE_DIR}")
    
    # Try multiple possible locations for the dummy_data directory
    possible_paths = [
        os.path.join(settings.BASE_DIR, 'pti_app', 'dummy_data'),
        os.path.join(settings.BASE_DIR, 'dummy_data'),
        os.path.join(settings.BASE_DIR, 'pti', 'pti_app', 'dummy_data'),
        os.path.join(os.path.dirname(settings.BASE_DIR), 'pti_app', 'dummy_data'),
    ]
    
    # Find the first valid directory
    dummy_data_dir = None
    for path in possible_paths:
        logger.info(f"Checking path: {path}")
        if os.path.exists(path) and os.path.isdir(path):
            dummy_data_dir = path
            logger.info(f"Found valid directory: {dummy_data_dir}")
            break
    
    if not dummy_data_dir:
        logger.error("Could not find dummy_data directory in any expected location")
        return JsonResponse({'images': [], 'error': 'Could not find dummy_data directory'})
    
    # Get all image files
    image_files = []
    try:
        for file in os.listdir(dummy_data_dir):
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                file_path = os.path.join(dummy_data_dir, file)
                
                try:
                    file_size = os.path.getsize(file_path)
                    
                    # URL encode the filename for the URL
                    url_encoded_name = urllib.parse.quote(file)
                    
                    image_files.append({
                        'name': file,
                        'size': file_size,
                        'url': f'/api/annotation-image/{url_encoded_name}',
                        'path': file_path  # Include path for debugging
                    })
                except Exception as e:
                    logger.error(f"Error processing file {file}: {str(e)}")
    except Exception as e:
        logger.error(f"Error listing directory: {str(e)}")
        return JsonResponse({'images': [], 'error': str(e)})
    
    logger.info(f"Found {len(image_files)} images: {[img['name'] for img in image_files]}")
    logger.info(f"Image paths: {[img['path'] for img in image_files]}")
    
    # Only return the necessary data to the client, not the full paths
    client_images = [{k: v for k, v in img.items() if k != 'path'} for img in image_files]
    return JsonResponse({'images': client_images})

# Add a new view for debugging purposes
def debug_info(request):
    """
    Return debugging information about the server environment
    """
    data = {
        'base_dir': str(settings.BASE_DIR),
        'cwd': os.getcwd(),
        'directory_structure': {}
    }
    
    # Add information about possible dummy_data directories
    possible_paths = [
        os.path.join(settings.BASE_DIR, 'pti_app', 'dummy_data'),
        os.path.join(settings.BASE_DIR, 'dummy_data'),
        os.path.join(settings.BASE_DIR, 'pti', 'pti_app', 'dummy_data'),
        os.path.join(os.path.dirname(settings.BASE_DIR), 'pti_app', 'dummy_data'),
    ]
    
    for path in possible_paths:
        data['directory_structure'][path] = {
            'exists': os.path.exists(path),
            'is_dir': os.path.isdir(path) if os.path.exists(path) else False,
            'files': list(os.listdir(path)) if os.path.exists(path) and os.path.isdir(path) else []
        }
    
    return JsonResponse(data)