import os
from pathlib import Path

# Directories to completely ignore during traversal
IGNORE_DIRS = {
    'node_modules', '.git', '__pycache__', 'dist', 'build', '.vite',
    'venv', '.venv', 'migrations', 'public', '.vscode', '.idea'
}

# Specific file names to ignore completely
IGNORE_FILES = {
    'package-lock.json', 'yarn.lock', '.DS_Store', 'db.sqlite3', 
    'scenthub_backend.txt', 'scenthub_frontend.txt', 'juntar_projeto.py'
}

# Allowed file extensions and specific target files
ALLOWED_EXTENSIONS = {'.ts', '.tsx', '.css', '.py', '.html', '.json', '.env'}
SPECIFIC_FILES = {'Dockerfile', '.env', 'manage.py'}

def process_directory(target_dir_name, output_filename, description):
    """
    Executes an isolated recursive scan on a specific target directory.
    Outputs the aggregated content into a dedicated text file.
    """
    root_path = Path.cwd()
    target_path = root_path / target_dir_name
    
    if not target_path.exists() or not target_path.is_dir():
        print(f"[AVISO] O diretório '{target_dir_name}' não foi encontrado a partir de: {root_path}")
        return

    print(f"Iniciando varredura isolada do {description} na pasta '{target_path}'...")
    collected_files = []

    # Map files within the specific target directory only
    for path in target_path.rglob('*'):
        # Filter ignored directories
        if any(part in IGNORE_DIRS for part in path.parts):
            continue
        
        if path.is_file():
            # Filter explicitly ignored files
            if path.name in IGNORE_FILES:
                continue
            
            ext = path.suffix
            # Match extensions or specific files
            if ext in ALLOWED_EXTENSIONS or path.name in SPECIFIC_FILES:
                collected_files.append(path)

    print(f"[{description}] Encontrados {len(collected_files)} arquivos válidos.")
    
    # Write aggregated content safely
    with open(output_filename, "w", encoding="utf-8") as outfile:
        for idx, path in enumerate(collected_files, 1):
            try:
                relative_path = path.relative_to(root_path)
            except ValueError:
                relative_path = path.name # Fallback if outside tree

            print(f"A processar [{idx}/{len(collected_files)}]: {relative_path}")
            
            outfile.write(f"\n{'='*50}\n")
            outfile.write(f"FILE: {relative_path}\n")
            outfile.write(f"{'='*50}\n\n")
            
            try:
                with open(path, "r", encoding="utf-8") as f:
                    outfile.write(f.read())
            except Exception as e:
                outfile.write(f"[ERRO AO LER ARQUIVO: {e}]")
            outfile.write("\n")
            
            # Force OS to flush buffer to disk immediately
            outfile.flush()
            
    print(f"-> Sucesso! Ficheiro '{output_filename}' gerado com {len(collected_files)} arquivos.\n")

def main():
    """
    Triggers discrete scans for backend and frontend domains.
    """
    print("Iniciando o mapeamento estruturado do projeto...\n")
    
    # 1. Mapeia o Backend inteiro
    process_directory('backend', 'scenthub_backend.txt', 'BACK-END (Django)')
    
    # 2. Mapeia apenas a lógica do Frontend (src)
    # Usa a sintaxe Pathlib correta para unir caminhos de forma segura em qualquer SO
    front_src_path = Path('frontend') / 'src'
    process_directory(front_src_path, 'scenthub_frontend.txt', 'FRONT-END (React Source)')
    
    # 3. (Opcional) Captura as configurações da raiz do Frontend se necessário
    # process_directory('frontend', 'scenthub_frontend_config.txt', 'FRONT-END (Root Configs)')
    
    print("Varredura 100% concluída. Verifique os arquivos gerados na raiz.")

if __name__ == "__main__":
    main()