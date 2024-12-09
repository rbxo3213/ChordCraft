import os

# 처리할 확장자 목록
TARGET_EXT = ['.js', '.html']

# 무시할 디렉토리 (node_modules 등)
IGNORE_DIRS = ['node_modules']

# 출력 디렉토리
OUTPUT_DIR = 'output'
OUTPUT_FILE = 'all_sources.txt'

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILE)

# 파일을 쓰기 모드로 열어 한번에 처리
with open(output_path, 'w', encoding='utf-8') as out:

    # 탐색할 디렉토리 목록 (프로젝트 구조 상 backend, frontend 등을 포함)
    SEARCH_DIRS = ['backend', 'frontend']

    for search_dir in SEARCH_DIRS:
        for root, dirs, files in os.walk(search_dir):
            # 무시 디렉토리 제거
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for filename in files:
                _, ext = os.path.splitext(filename)
                if ext in TARGET_EXT:
                    filepath = os.path.join(root, filename)
                    # 상대 경로 구하기(현재 실행 스크립트 위치 기준)
                    relative_path = os.path.relpath(filepath)

                    # 파일 내용 읽기
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # output 파일에 기록
                    # 파일경로 출력
                    out.write(f"파일경로: {relative_path}\n")
                    # 소스코드 출력
                    out.write(content)
                    out.write("\n\n")  # 파일간 구분을 위해 빈 줄 두개
