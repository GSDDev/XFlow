from fastapi import APIRouter, HTTPException
import httpx
import os

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# We can get the URL from environment or fallback to the provided one
GITHUB_REPO_URL = os.getenv("GITHUB_JOBS_URL", "https://github.com/GSDDev/XFlow-jobs")
# Convert repository URL to GitHub API contents URL
# Example: https://github.com/GSDDev/XFlow-jobs -> https://api.github.com/repos/GSDDev/XFlow-jobs/contents
API_BASE_URL = GITHUB_REPO_URL.replace("https://github.com/", "https://api.github.com/repos/") + "/contents"

@router.get("")
async def list_jobs():
    """
    Fetch the list of jobs from the GitHub repository.
    Pattern: ProjectCode_ProjectName/ProjectCode_ProjectName.py
    Ignore: _Library folder
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(API_BASE_URL)
            response.raise_for_status()
            contents = response.json()
            
            jobs = []
            for item in contents:
                # We only care about directories that are not _Library
                if item["type"] == "dir" and not item["name"].startswith("_"):
                    project_dir = item["name"]
                    
                    # Now check if the expected .py file exists inside this directory
                    # We'll make another request for the subfolder
                    # NOTE: In a real production environment, we might want to cache this 
                    # or use a recursive tree API call if there are many jobs.
                    
                    sub_response = await client.get(item["url"])
                    if sub_response.status_code == 200:
                        sub_contents = sub_response.json()
                        expected_file = f"{project_dir}.py"
                        
                        has_main_file = any(
                            sub_item["type"] == "file" and sub_item["name"] == expected_file 
                            for sub_item in sub_contents
                        )
                        
                        if has_main_file:
                            code = project_dir.split("_")[0] if "_" in project_dir else ""
                            # Project is the letters without numbers from the code
                            import re
                            project = re.sub(r'[^a-zA-Z]', '', code)
                            
                            jobs.append({
                                "id": project_dir,
                                "name": project_dir.split("_")[-1] if "_" in project_dir else project_dir,
                                "code": code,
                                "project": project,
                                "path": project_dir,
                                "main_file": expected_file,
                                "url": item["html_url"]
                            })
            
            return {"jobs": jobs}
            
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Error fetching jobs from GitHub: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
