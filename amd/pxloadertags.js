// Tag object to handle tag intersection; once created not meant to be changed
// Performance rationale: http://jsperf.com/lists-indexof-vs-in-operator/3
define(
    [],
function(){
    var PxLoaderTags = function(values) {

        this.array = [];
        this.object = {};
        this.value = null; // single value
        this.length = 0;

        if (values !== null && values !== undefined) {
            if (Array.isArray(values)) {
                this.array = values;
            } else if (typeof values === 'object') {
                for (var key in values) {
                    this.array.push(key);
                }
            } else {
                this.array.push(values);
                this.value = values;
            }

            this.length = this.array.length;

            // convert array values to object with truthy values, used by contains function below
            for (var i = 0; i < this.length; i++) {
                this.object[this.array[i]] = true;
            }
        }

        // compare this object with another; return true if they share at least one value
        this.contains = function(other) {
            if (this.length === 0 || other.length === 0) {
                return false;
            } else if (this.length === 1 && this.value !== null) {
                if (other.length === 1) {
                    return this.value === other.value;
                } else {
                    return other.object.hasOwnProperty(this.value);
                }
            } else if (other.length < this.length) {
                return other.contains(this); // better to loop through the smaller object
            } else {
                for (var key in this.object) {
                    if (other.object[key]) {
                        return true;
                    }
                }
                return false;
            }
        };
    };

    return PxLoaderTags;

});
