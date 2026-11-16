# Module generic attributes OpenStreetMap

## Introduction
The generic attributes OpenStreetMap module allows you to choose the OpenStreetMap provider for geolocation questions of a form.

## Configuration
With the default security headers settings, maps cannot be displayed correctly. For each page containing a map, you must assign values to two security headers to restore the map display. Here’s how to do it:

- On the page containing the map, in the displayed URL, extract the string that begins with /jsp/xxx.
If this part contains one or more identifiers that are likely to change (numeric form identifiers, for example), replace them with an asterisk so that the maps are displayed consistently. For instance, if the url containing the page is "http://localhost:8080/lutece/jsp/admin/plugins/forms/ManageFormResponse.jsp?&view=stepView&id_form=15&init=true", then the part to be extracted is "/jsp/admin/plugins/forms/ManageFormResponse.jsp?&view=stepView&id_form=*&init=true"


- Modifying the value of **Content-Security-Policy** header :
    - In the back office, go to System > Security Header Management
    - Click the “View more” button for the Content-Security-Policy header
    - On the management page, click “Create an exception”
    - In the **Value** field, add the following value : default-src 'self'; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; connect-src * blob:; object-src 'none'; font-src * data:;form-action 'self'; frame-ancestors 'self'; frame-src *; upgrade-insecure-requests
    - In the URL pattern field, add the string starting with /jsp/xxx that you retrieved earlier
    - Click “Create” and then “Back”


- Modifying the value of **Cross-Origin-Embedder-Policy** header :
    - Perform the same steps as for the previous header, except that add the following value for **Value** field : unsafe-none

You should now be able to see your maps.

## Usage
On the page for creating or editing a geolocation question in a form, select ‘OpenStreetMap’ from the drop-down list for the ‘Map’ attribute. When the question is displayed so that a response can be entered, an OpenStreetMap map will appear on the screen.