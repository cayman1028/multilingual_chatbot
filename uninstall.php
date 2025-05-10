<?php
// WordPressからの直接アクセスでない場合は終了
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// プラグインのオプションを削除
delete_option('chatbot_settings');
