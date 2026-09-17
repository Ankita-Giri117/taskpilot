from task_manager import create_task, list_tasks, complete_task


print("\n--- CREATE TASK ---")
print(create_task("Practice aptitude questions"))

print("\n--- CREATE TASK ---")
print(create_task("Revise OOP concepts"))

print("\n--- LIST TASKS ---")
print(list_tasks())

print("\n--- COMPLETE TASK ---")
print(complete_task(1))

print("\n--- LIST TASKS AGAIN ---")
print(list_tasks())