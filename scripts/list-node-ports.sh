#!/bin/bash

# 函数：截断长文本
truncate_text() {
    local text="$1"
    local max_length="$2"
    if [ ${#text} -gt $max_length ]; then
        echo "${text:0:$max_length}..."
    else
        echo "$text"
    fi
}

# 函数：提取进程简短描述
get_process_description() {
    local command="$1"

    # 提取关键信息
    if [[ "$command" == *"vite"* ]]; then
        echo "Vite 开发服务器"
    elif [[ "$command" == *"pnpm run dev"* ]]; then
        echo "PNPM 开发命令"
    elif [[ "$command" == *"typescript"* ]]; then
        echo "TypeScript 语言服务"
    elif [[ "$command" == *"tailwindcss"* ]]; then
        echo "TailwindCSS 语言服务"
    elif [[ "$command" == *"Creative Cloud"* ]]; then
        echo "Adobe Creative Cloud"
    elif [[ "$command" == *"augment"* ]]; then
        echo "Augment 代码助手"
    elif [[ "$command" == *"js-language-service"* ]]; then
        echo "JavaScript 语言服务"
    else
        # 提取文件名
        local basename=$(basename "$command" | cut -d' ' -f1)
        echo "$basename"
    fi
}

# 函数：显示所有 Node 进程
show_node_processes() {
    echo ""
    echo "🔍 正在扫描 Node.js 进程..."
    echo ""

    # 存储进程信息的数组
    declare -a pids=()
    declare -a process_info=()
    local index=1

    # 表头
    printf "┌─────┬─────────┬─────────┬──────────────────────────────────────────────────┐\n"
    printf "│ %-3s │ %-7s │ %-7s │ %-48s │\n" "编号" "PID" "端口" "进程描述"
    printf "├─────┼─────────┼─────────┼──────────────────────────────────────────────────┤\n"

    # 找出所有 Node 进程 PID
    for pid in $(pgrep node); do
        # 查端口
        ports=$(lsof -Pan -p $pid -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $9}' | cut -d':' -f2 | tr '\n' ',' | sed 's/,$//')
        command=$(ps -p $pid -o command= 2>/dev/null)

        if [ -n "$command" ]; then
            pids+=($pid)

            # 格式化端口显示
            if [ -n "$ports" ]; then
                port_display="$ports"
            else
                port_display="-"
            fi

            # 获取进程描述
            description=$(get_process_description "$command")
            description=$(truncate_text "$description" 48)

            # 格式化输出
            printf "│ %-3s │ %-7s │ %-7s │ %-48s │\n" "[$index]" "$pid" "$port_display" "$description"

            # 存储完整信息用于交互模式
            if [ -n "$ports" ]; then
                info="PID: $pid  |  端口: $ports  |  描述: $description"
            else
                info="PID: $pid  |  (未监听端口)  |  描述: $description"
            fi
            process_info+=("$info")
            ((index++))
        fi
    done

    printf "└─────┴─────────┴─────────┴──────────────────────────────────────────────────┘\n"
    echo ""

    # 统计信息
    local total_processes=${#pids[@]}
    local listening_processes=0
    for pid in "${pids[@]}"; do
        ports=$(lsof -Pan -p $pid -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $9}' | cut -d':' -f2 | tr '\n' ',' | sed 's/,$//')
        if [ -n "$ports" ]; then
            ((listening_processes++))
        fi
    done

    echo "📊 统计: 共找到 $total_processes 个 Node.js 进程，其中 $listening_processes 个正在监听端口"

    # 返回进程数量到 stderr，这样不会被命令替换捕获
    echo ${#pids[@]} >&2
}

# 函数：获取进程数量
get_process_count() {
    local count=0
    for pid in $(pgrep node); do
        command=$(ps -p $pid -o command= 2>/dev/null)
        if [ -n "$command" ]; then
            ((count++))
        fi
    done
    echo $count
}

# 函数：交互模式
interactive_mode() {
    local process_count
    declare -a pids=()
    declare -a process_info=()
    local index=1

    # 重新收集进程信息（因为函数作用域问题）
    for pid in $(pgrep node); do
        command=$(ps -p $pid -o command= 2>/dev/null)
        if [ -n "$command" ]; then
            pids+=($pid)
            ports=$(lsof -Pan -p $pid -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $9}' | cut -d':' -f2 | tr '\n' ',' | sed 's/,$//')
            description=$(get_process_description "$command")
            if [ -n "$ports" ]; then
                info="PID: $pid  |  端口: $ports  |  描述: $description"
            else
                info="PID: $pid  |  (未监听端口)  |  描述: $description"
            fi
            process_info+=("$info")
            ((index++))
        fi
    done

    process_count=${#pids[@]}

    if [ $process_count -eq 0 ]; then
        echo "没有找到 Node.js 进程。"
        return
    fi

    echo ""
    echo "🎮 进入交互模式"
    echo "┌─────────────────────────────────────────────────────────────────────────────┐"
    echo "│  💡 操作说明:                                                               │"
    echo "│     • 输入数字 [1-$process_count]: 选择要终止的进程                         │"
    echo "│     • 输入 'r' 或 'R': 刷新进程列表                                        │"
    echo "│     • 输入 'q' 或 'Q': 退出交互模式                                        │"
    echo "└─────────────────────────────────────────────────────────────────────────────┘"

    while true; do
        echo ""
        read -p "🎯 请选择操作 [1-$process_count/q/r]: " choice

        case $choice in
            q|Q)
                echo ""
                echo "👋 退出交互模式，再见！"
                break
                ;;
            r|R)
                echo ""
                echo "🔄 正在刷新进程列表..."
                show_node_processes
                process_count=$(get_process_count)
                # 重新收集进程信息
                pids=()
                process_info=()
                index=1
                for pid in $(pgrep node); do
                    command=$(ps -p $pid -o command= 2>/dev/null)
                    if [ -n "$command" ]; then
                        pids+=($pid)
                        ports=$(lsof -Pan -p $pid -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $9}' | cut -d':' -f2 | tr '\n' ',' | sed 's/,$//')
                        description=$(get_process_description "$command")
                        if [ -n "$ports" ]; then
                            info="PID: $pid  |  端口: $ports  |  描述: $description"
                        else
                            info="PID: $pid  |  (未监听端口)  |  描述: $description"
                        fi
                        process_info+=("$info")
                        ((index++))
                    fi
                done
                process_count=${#pids[@]}
                if [ $process_count -eq 0 ]; then
                    echo "ℹ️  没有找到 Node.js 进程。"
                    break
                fi
                echo "┌─────────────────────────────────────────────────────────────────────────────┐"
                echo "│  💡 操作说明:                                                               │"
                echo "│     • 输入数字 [1-$process_count]: 选择要终止的进程                         │"
                echo "│     • 输入 'r' 或 'R': 刷新进程列表                                        │"
                echo "│     • 输入 'q' 或 'Q': 退出交互模式                                        │"
                echo "└─────────────────────────────────────────────────────────────────────────────┘"
                ;;
            ''|*[!0-9]*)
                echo "❌ 无效输入。请输入数字、'q' 或 'r'。"
                ;;
            *)
                if [ "$choice" -ge 1 ] && [ "$choice" -le $process_count ]; then
                    selected_index=$((choice - 1))
                    selected_pid=${pids[$selected_index]}
                    selected_info=${process_info[$selected_index]}

                    echo ""
                    echo "⚠️  您选择了以下进程："
                    echo "┌─────────────────────────────────────────────────────────────────────────────┐"
                    echo "│ $selected_info"
                    echo "└─────────────────────────────────────────────────────────────────────────────┘"
                    echo ""
                    read -p "🔥 确认要终止这个进程吗？(y/N): " confirm

                    case $confirm in
                        y|Y|yes|YES)
                            if kill $selected_pid 2>/dev/null; then
                                echo ""
                                echo "✅ 进程 $selected_pid 已成功终止！"
                                # 等待一下让进程完全退出
                                sleep 1
                                # 自动刷新列表
                                echo ""
                                echo "🔄 自动刷新进程列表..."
                                show_node_processes
                                process_count=$(get_process_count)
                                # 重新收集进程信息
                                pids=()
                                process_info=()
                                index=1
                                for pid in $(pgrep node); do
                                    command=$(ps -p $pid -o command= 2>/dev/null)
                                    if [ -n "$command" ]; then
                                        pids+=($pid)
                                        ports=$(lsof -Pan -p $pid -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $9}' | cut -d':' -f2 | tr '\n' ',' | sed 's/,$//')
                                        description=$(get_process_description "$command")
                                        if [ -n "$ports" ]; then
                                            info="PID: $pid  |  端口: $ports  |  描述: $description"
                                        else
                                            info="PID: $pid  |  (未监听端口)  |  描述: $description"
                                        fi
                                        process_info+=("$info")
                                        ((index++))
                                    fi
                                done
                                process_count=${#pids[@]}
                                if [ $process_count -eq 0 ]; then
                                    echo "ℹ️  没有找到 Node.js 进程。"
                                    break
                                fi
                            else
                                echo ""
                                echo "❌ 无法终止进程 $selected_pid"
                                echo "💡 可能原因: 需要 sudo 权限或进程已经不存在"
                            fi
                            ;;
                        *)
                            echo ""
                            echo "🚫 操作已取消"
                            ;;
                    esac
                else
                    echo "❌ 无效的进程编号。请输入 1-$process_count 之间的数字。"
                fi
                ;;
        esac
    done
}

# 主程序
show_node_processes
process_count=$(get_process_count)

if [ "$process_count" -gt 0 ]; then
    echo ""
    echo "🎮 是否进入交互模式来管理这些进程？"
    read -p "   输入 'y' 进入交互模式，其他键退出 (y/N): " enter_interactive
    case $enter_interactive in
        y|Y|yes|YES)
            interactive_mode
            ;;
        *)
            echo ""
            echo "👋 脚本已退出，再见！"
            ;;
    esac
else
    echo ""
    echo "ℹ️  没有找到运行中的 Node.js 进程"
fi
