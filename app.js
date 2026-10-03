$(function () {
    const $form = $('#calculator-form');
    const $units = $('#units');
    const $feedback = $('#units-feedback');
    const $requestError = $('#request-error');
    const $submitButton = $form.find('button[type="submit"]');
    const submitMarkup = $submitButton.html();

    function validateUnits() {
        const value = $units.val().trim();
        const valid = /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
        const invalid = value !== '' && !valid;

        $units.toggleClass('is-invalid', invalid);
        $units.attr('aria-invalid', invalid ? 'true' : 'false');
        $feedback.toggle(invalid);
        return valid && value !== '';
    }

    function formatMoney(amount) {
        return Number(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function showResult(result) {
        $('#total-amount').text(formatMoney(result.bill));
        $('#result-units').text(Number(result.units).toLocaleString('en-IN'));

        const $breakdown = $('#breakdown').empty();
        if (result.breakdown.length === 0) {
            $('<div>', { class: 'breakdown-row' })
                .append($('<span>').text('No units consumed'))
                .append($('<strong>').text('Rs. 0.00'))
                .appendTo($breakdown);
        } else {
            result.breakdown.forEach(function (row) {
                $('<div>', { class: 'breakdown-row' })
                    .append($('<span>').text(
                        row.label + ' · ' + row.units + ' × Rs. ' + formatMoney(row.rate)
                    ))
                    .append($('<strong>').text('Rs. ' + formatMoney(row.amount)))
                    .appendTo($breakdown);
            });
        }

        $('#empty-result').addClass('d-none');
        $('#bill-result').removeClass('d-none');
    }

    $units.on('input', function () {
        validateUnits();
        $requestError.addClass('d-none').text('');
    });

    $form.on('submit', function (event) {
        event.preventDefault();
        $requestError.addClass('d-none').text('');

        if (!validateUnits()) {
            $units.trigger('focus');
            return;
        }

        $submitButton.prop('disabled', true).text('Calculating...');
        $.ajax({
            url: $form.attr('action'),
            method: 'POST',
            data: { units: $units.val().trim() },
            dataType: 'json'
        })
            .done(showResult)
            .fail(function (xhr) {
                const message = xhr.responseJSON && xhr.responseJSON.error
                    ? xhr.responseJSON.error
                    : 'Unable to calculate the bill right now. Please try again.';
                $requestError.text(message).removeClass('d-none');
            })
            .always(function () {
                $submitButton.prop('disabled', false).html(submitMarkup);
            });
    });
});
