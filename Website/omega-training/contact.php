<?php
/**
 * Omega Training — contact form handler
 * Sends enquiries from the contact form to the address below.
 *
 * Hosting: 20i (PHP). Uses PHP mail(). The From address is built from the
 * live domain so it aligns with the domain's SPF/DKIM records (set up by 20i
 * for domains hosted with them) — this is what keeps enquiries out of spam.
 *
 * If deliverability is ever poor, create a real "website@yourdomain" mailbox
 * in 20i and switch to authenticated SMTP (PHPMailer). For now this is
 * dependency-free and works on standard 20i hosting.
 */

// ---- Config ------------------------------------------------------------
$TO      = 'c.dyson@omegalife.uk';          // where enquiries are delivered
$SUBJECT = 'New enquiry from the Omega Training website';

// ---- Helpers -----------------------------------------------------------
$wantsJson = (
  (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
  || (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
);

function respond($ok, $message, $wantsJson, $code = 200) {
  http_response_code($code);
  if ($wantsJson) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(array('ok' => $ok, 'message' => $message));
    exit;
  }
  // No-JS fallback: a small branded confirmation page.
  $heading = $ok ? 'Thank you' : 'Something went wrong';
  header('Content-Type: text/html; charset=UTF-8');
  echo '<!doctype html><html lang="en"><head><meta charset="UTF-8">'
     . '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
     . '<title>' . htmlspecialchars($heading) . ' | Omega Training</title>'
     . '<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">'
     . '<link rel="stylesheet" href="css/styles.css"></head>'
     . '<body><section class="page-header"><div class="container">'
     . '<h1>' . htmlspecialchars($heading) . '</h1>'
     . '<p class="lede" style="margin-top:16px;">' . htmlspecialchars($message) . '</p>'
     . '<a href="contact.html" class="btn btn-primary" style="margin-top:28px;">Back to contact</a>'
     . '</div></section></body></html>';
  exit;
}

// Strip CR/LF so user input can never inject extra mail headers.
function clean_header($value) {
  return trim(str_replace(array("\r", "\n", "%0a", "%0d"), '', $value));
}

// ---- Guard: POST only --------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  respond(false, 'Please submit the form from the contact page.', $wantsJson, 405);
}

// ---- Honeypot: real people leave this empty ----------------------------
if (!empty($_POST['company_url'])) {
  // Silently accept so bots think they succeeded, but send nothing.
  respond(true, 'Thanks, your enquiry has been received.', $wantsJson);
}

// ---- Collect + validate ------------------------------------------------
$name         = isset($_POST['name']) ? trim($_POST['name']) : '';
$organisation = isset($_POST['organisation']) ? trim($_POST['organisation']) : '';
$email        = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone        = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$course       = isset($_POST['course']) ? trim($_POST['course']) : '';
$message      = isset($_POST['message']) ? trim($_POST['message']) : '';

$errors = array();
if ($name === '' || mb_strlen($name) > 100) {
  $errors[] = 'a valid name';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
  $errors[] = 'a valid email address';
}
if ($message === '' || mb_strlen($message) > 5000) {
  $errors[] = 'a message';
}

if (!empty($errors)) {
  respond(false, 'Please provide ' . implode(', ', $errors) . '.', $wantsJson, 422);
}

// ---- Build the email ---------------------------------------------------
$host = isset($_SERVER['HTTP_HOST']) ? preg_replace('/^www\./', '', $_SERVER['HTTP_HOST']) : 'localhost';
$host = preg_replace('/[^a-zA-Z0-9\.\-]/', '', $host); // sanitise for header use
$fromAddress = 'website@' . $host;

$safeName  = clean_header($name);
$safeEmail = clean_header($email);

$body  = "New enquiry from the Omega Training website\n";
$body .= "------------------------------------------------\n\n";
$body .= "Name:         " . $name . "\n";
$body .= "Organisation: " . ($organisation !== '' ? $organisation : '(not given)') . "\n";
$body .= "Email:        " . $email . "\n";
$body .= "Phone:        " . ($phone !== '' ? $phone : '(not given)') . "\n";
$body .= "Course:       " . ($course !== '' ? $course : '(not specified)') . "\n\n";
$body .= "Message:\n" . $message . "\n\n";
$body .= "------------------------------------------------\n";
$body .= "Sent " . date('j M Y, H:i') . " from " . $host . "\n";

$headers  = 'From: Omega Training Website <' . $fromAddress . ">\r\n";
$headers .= 'Reply-To: ' . $safeName . ' <' . $safeEmail . ">\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// ---- Send --------------------------------------------------------------
$sent = @mail($TO, '=?UTF-8?B?' . base64_encode($SUBJECT) . '?=', $body, $headers, '-f' . $fromAddress);

if ($sent) {
  respond(true, "Thanks, your enquiry is on its way. We'll be in touch shortly.", $wantsJson);
} else {
  respond(false, 'Sorry, we could not send your enquiry. Please email c.dyson@omegalife.uk or call 0151 487 0055.', $wantsJson, 500);
}
