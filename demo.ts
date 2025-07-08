#!/usr/bin/env node

import {
    DataManager,
    createProject,
    createTaskSetWithTasks,
    addTaskSetToProject,
    updateTaskSetInProject,
    startTask,
    completeTask,
    updateTaskInTaskSet,
    createSchedule,
    getUpcomingSchedules,
    getProjectProgress,
} from "./src/shared/core/index.ts";

async function main() {
    console.log("=== Taskell Core Demo ===\n");
    
    const dataManager = new DataManager();
    await dataManager.initialize();
    
    console.log("1. プロジェクトの作成");
    const project = createProject("Webアプリ開発", "新しいWebアプリケーションの開発プロジェクト");
    console.log(`プロジェクト作成: ${project.name} (ID: ${project.id})`);
    
    console.log("\n2. タスクセットの作成と追加");
    const backendTaskSet = createTaskSetWithTasks(
        "バックエンド開発",
        [
            "データベーススキーマの設計",
            "APIエンドポイントの実装",
            "認証機能の実装",
            "テストの作成",
        ],
        "バックエンドのAPI開発タスク"
    );
    
    const frontendTaskSet = createTaskSetWithTasks(
        "フロントエンド開発",
        [
            "UIコンポーネントの設計",
            "ルーティングの設定",
            "API連携の実装",
            "レスポンシブデザインの適用",
        ],
        "フロントエンドのUI開発タスク"
    );
    
    let updatedProject = addTaskSetToProject(project, backendTaskSet);
    updatedProject = addTaskSetToProject(updatedProject, frontendTaskSet);
    
    console.log(`タスクセット追加: ${backendTaskSet.name} (${backendTaskSet.tasks.length}タスク)`);
    console.log(`タスクセット追加: ${frontendTaskSet.name} (${frontendTaskSet.tasks.length}タスク)`);
    
    console.log("\n3. タスクの進行");
    let task1 = backendTaskSet.tasks[0];
    task1 = startTask(task1);
    console.log(`タスク開始: "${task1.content}" (ステータス: ${task1.status})`);
    
    task1 = completeTask(task1);
    console.log(`タスク完了: "${task1.content}" (ステータス: ${task1.status})`);
    
    let updatedBackendTaskSet = updateTaskInTaskSet(backendTaskSet, task1);
    
    let task2 = updatedBackendTaskSet.tasks[1];
    task2 = startTask(task2);
    updatedBackendTaskSet = updateTaskInTaskSet(updatedBackendTaskSet, task2);
    console.log(`タスク開始: "${task2.content}" (ステータス: ${task2.status})`);
    
    updatedProject = updateTaskSetInProject(updatedProject, updatedBackendTaskSet);
    
    console.log("\n4. スケジュールの作成");
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const backendSchedule = createSchedule(
        backendTaskSet.id,
        today,
        {
            interval: "daily",
            endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
        }
    );
    
    const frontendSchedule = createSchedule(
        frontendTaskSet.id,
        tomorrow
    );
    
    await dataManager.addSchedule(backendSchedule);
    await dataManager.addSchedule(frontendSchedule);
    
    console.log(`スケジュール登録: ${backendTaskSet.name} - 毎日実施（1週間）`);
    console.log(`スケジュール登録: ${frontendTaskSet.name} - 明日実施`);
    
    console.log("\n5. 今後のスケジュール表示（7日間）");
    const schedules = dataManager.getSchedules();
    const upcomingSchedules = getUpcomingSchedules(schedules, today, 7);
    
    console.log("今後のスケジュール:");
    upcomingSchedules.forEach(schedule => {
        const taskSet = schedule.taskSetId === backendTaskSet.id ? backendTaskSet : frontendTaskSet;
        console.log(`- ${schedule.scheduledDate.toLocaleDateString()}: ${taskSet.name}`);
    });
    
    console.log("\n6. プロジェクトの進捗状況");
    const progress = getProjectProgress(updatedProject);
    console.log(`総タスクセット数: ${progress.totalTaskSets}`);
    console.log(`完了タスクセット数: ${progress.completedTaskSets}`);
    console.log(`総タスク数: ${progress.totalTasks}`);
    console.log(`完了タスク数: ${progress.completedTasks}`);
    console.log(`全体の完了率: ${progress.overallCompletionRate.toFixed(1)}%`);
    
    console.log("\n7. データの保存");
    await dataManager.addProject(updatedProject);
    console.log("プロジェクトデータを保存しました");
    
    console.log("\n=== デモで見つかった課題 ===");
    console.log("1. タスクの並び替え機能がない");
    console.log("2. タスクセット間でタスクを移動できない");
    console.log("3. タスクの検索機能がない");
    console.log("4. タスクの履歴管理がない");
    console.log("5. 複数ユーザーでの同時編集に対応していない");
    console.log("6. タスクの見積もり時間と実績時間の管理がない");
    console.log("7. タスクのタグやカテゴリによるフィルタリングがない");
    console.log("8. 通知機能がない（期限切れ、スケジュールなど）");
    console.log("9. タスクテンプレート機能がない");
    console.log("10. 外部カレンダーとの連携機能がない");
}

main().catch(console.error);