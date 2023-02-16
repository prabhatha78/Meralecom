const form = document.getElementById('form');
const firstname = document.getElementById('firstname');
const lastname = document.getElementById('lastname');
const email = document.getElementById('email');
const contact = document.getElementById('contact');
const password = document.getElementById('password');
const password2 = document.getElementById('password2');
if(form){
    form.addEventListener('submit', e => {
        e.preventDefault();
    
        validateInputs();
    });    
}

const setError = (element, message) => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.error');

    errorDisplay.innerText = message;
    inputControl.classList.add('error');
    inputControl.classList.remove('success')
}

const setSuccess = element => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.error');

    errorDisplay.innerText = '';
    inputControl.classList.add('success');
    inputControl.classList.remove('error');
};

const isValidEmail = email => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

const validateInputs = () => {
    const firstnameValue = firstname.value.trim();
    const lastnameValue = lastname.value.trim();
    const emailValue = email.value.trim();
    const contactValue = parseInt(contact.value.trim());
    const passwordValue = password.value.trim();
    const password2Value = password2.value.trim();

    if (firstnameValue === '') {
        setError(firstname, 'First name required');
    } else {
        setSuccess(firstname);
        var fname = true;
    }


    if (lastnameValue === '') {
        setError(lastname, 'Last name required');
    } else {
        setSuccess(lastname);
        var lname = true;
    }


    if (emailValue === '') {
        setError(email, 'Email is required');
    } else if (!isValidEmail(emailValue)) {
        setError(email, 'Provide a valid email address');
    } else {
        setSuccess(email);
        var mail = true;
    }

    if (contactValue === '') {
        setError(contact, 'Contact number is required');
    } else if(isNaN(contactValue)){
        setError(contact, 'Enter digits only')
    } else if (contactValue.length < 10) {
        setError(contact, 'Enter a valid contact number')
    } else {
        setSuccess(contact);
        var phone = true;
    }

    if (passwordValue === '') {
        setError(password, 'Password is required');
    } else if (passwordValue.length < 8) {
        setError(password, 'Password must be at least 8 character.')
    } else {
        setSuccess(password);
        var pass = true;
    }

    if (password2Value === '') {
        setError(password2, 'Please confirm your password');
    } else if (password2Value !== passwordValue) {
        setError(password2, "Passwords doesn't match");
        var pass = false;
    } else {
        setSuccess(password2);
        var pass = true;
    }

    var valid = fname && lname && mail && phone && pass;

    if (valid) {
        form.submit();
    }

};

