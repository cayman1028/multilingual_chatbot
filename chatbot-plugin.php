<?php
/**
 * Plugin Name: カスタムチャットボット
 * Description: 企業サイト向けカスタマイズ可能なチャットボット
 * Version: 1.0.0
 * Author: 山崎　隆
 * Text Domain: custom-chatbot
 * Domain Path: /languages
 */

// 直接アクセス禁止
if (!defined('ABSPATH')) {
    exit;
}

// プラグインのパスとURLを定義
define('CHATBOT_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('CHATBOT_PLUGIN_URL', plugin_dir_url(__FILE__));

// チャットボットのスクリプトとスタイルを登録
function chatbot_enqueue_scripts() {
    // CSSファイルを登録
    wp_enqueue_style(
        'chatbot-style',
        CHATBOT_PLUGIN_URL . 'css/chatbot-style.css',
        array(),
        filemtime(CHATBOT_PLUGIN_PATH . 'css/chatbot-style.css')
    );
    
    // データファイルを登録（依存関係なし - 最初に読み込む）
    wp_enqueue_script(
        'chatbot-data',
        CHATBOT_PLUGIN_URL . 'js/chatbot-data.js',
        array(),
        filemtime(CHATBOT_PLUGIN_PATH . 'js/chatbot-data.js'),
        true
    );
    
    // メインJSファイルを登録（データファイルに依存）
    wp_enqueue_script(
        'chatbot-js',
        CHATBOT_PLUGIN_URL . 'js/chatbot.js',
        array('chatbot-data'),  // データファイルに依存させる
        filemtime(CHATBOT_PLUGIN_PATH . 'js/chatbot.js'),
        true
    );
}
add_action('wp_enqueue_scripts', 'chatbot_enqueue_scripts');

// プラグイン有効化時の処理
register_activation_hook(__FILE__, 'chatbot_activate');
function chatbot_activate() {
    // プラグイン有効化時にjs/フォルダとcss/フォルダが存在しない場合は作成
    $js_dir = CHATBOT_PLUGIN_PATH . 'js';
    if (!file_exists($js_dir)) {
        wp_mkdir_p($js_dir);
    }
    
    $css_dir = CHATBOT_PLUGIN_PATH . 'css';
    if (!file_exists($css_dir)) {
        wp_mkdir_p($css_dir);
    }
}

// プラグイン無効化時の処理
register_deactivation_hook(__FILE__, 'chatbot_deactivate');
function chatbot_deactivate() {
    // 将来的にクリーンアップが必要な場合はここに記述
}

// プラグインの詳細情報を追加
function chatbot_plugin_row_meta($links, $file) {
    if (plugin_basename(__FILE__) === $file) {
        // 「プラグインのサイトを表示」リンクを追加しない
        $links[] = '<a href="#" onclick="jQuery(\'#chatbot-plugin-details\').toggle(); return false;">詳細を表示</a>';
        
        // 詳細情報を非表示DIVとして追加
        echo '<div id="chatbot-plugin-details" style="display:none; margin: 10px; padding: 10px; border: 1px solid #ddd; background: #f9f9f9;">';
        echo '<h3>カスタムチャットボットの詳細情報</h3>';
        echo '<p>このプラグインは、企業サイト向けのカスタマイズ可能なチャットボットを提供します。</p>';
        echo '<h4>主な特徴:</h4>';
        echo '<ul>';
        echo '<li>モダンでレスポンシブなデザイン</li>';
        echo '<li>カスタマイズ可能なQ&Aデータベース</li>';
        echo '<li>自動応答機能</li>';
        echo '<li>モバイル対応</li>';
        echo '</ul>';
        
        // お問い合わせ情報を構造化して表示
        echo '<h4>お問い合わせ：</h4>';
        echo '<p>チャットボットについてのお問い合わせは下記までお願いいたします。<br>';
        echo '山崎　隆<br>';
        echo 'y53349311@gmail.com</p>';
        
        echo '</div>';
    }
    return $links;
}
add_filter('plugin_row_meta', 'chatbot_plugin_row_meta', 10, 2);
