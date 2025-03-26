import subprocess
import sys
import os

def run_frontend():
    try:
        # Install dependencies if needed
        if not os.path.exists('node_modules'):
            print("Installing dependencies...")
            subprocess.run(['npm', 'install'], check=True)
        
        # Start the development server
        print("Starting frontend development server...")
        subprocess.run(['npm', 'run', 'dev'], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_frontend()