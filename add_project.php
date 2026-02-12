<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Check if this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get the input data
$code = isset($_POST['code']) ? trim($_POST['code']) : '';
$time = isset($_POST['time']) ? trim($_POST['time']) : '';
$theme = isset($_POST['theme']) ? trim($_POST['theme']) : '';
$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$authors = isset($_POST['authors']) ? trim($_POST['authors']) : '';

// Validate inputs
if (empty($code) || empty($time) || empty($theme) || empty($title) || empty($authors)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Path to the TSV file
$tsv_file = __DIR__ . '/grants_final.tsv';

// Check if file exists and is readable
if (!file_exists($tsv_file) || !is_readable($tsv_file)) {
    http_response_code(500);
    echo json_encode(['error' => 'Cannot read grants_final.tsv file']);
    exit;
}

// Format the new row matching the existing TSV format
// Format: "Code"\tYear\t"Theme"\t'Title'\t"Authors"
$newRow = '"' . $code . "\"\t" . $time . "\t\"" . $theme . "\"\t'" . $title . "'\t\"" . $authors . "\"";

// Append the new row to the file
$result = file_put_contents($tsv_file, $newRow . "\n", FILE_APPEND);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write to grants_final.tsv file']);
    exit;
}

// Success
http_response_code(200);
echo json_encode(['success' => true, 'message' => 'Project added successfully']);
exit;
?>
