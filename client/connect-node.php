<?php


// this turned out to not work as it would show up as offline, need to take a look at this logic


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $response = shell_exec('sh ../forever-start-node.sh');
    echo $response;
}
else {
    echo 'nope';
}

?>
